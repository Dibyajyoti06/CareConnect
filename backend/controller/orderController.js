import asyncHandler from '../middleware/asyncHandler.js';
import Medicine from '../models/medModel.js';
import Order from '../models/orderModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import razorpay from '../utils/razorpay.js';

const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  const isEmptyString = (value) =>
    value == null || (typeof value === 'string' && value.trim() === '');

  if (
    isEmptyString(paymentMethod) ||
    !shippingAddress ||
    !orderItems ||
    orderItems.length === 0
  ) {
    throw new ApiError(400, 'All fields are required.');
  }

  const hasInvalid = orderItems.some(
    (item) =>
      isEmptyString(item.name) ||
      item.qty == null ||
      item.qty <= 0 ||
      isEmptyString(item.image) ||
      item.price == null ||
      item.price < 0 ||
      !item.med
  );

  if (hasInvalid) {
    throw new ApiError(400, 'Invalid fields in order items.');
  }

  const fields = [
    shippingAddress.name,
    shippingAddress.address,
    shippingAddress.city,
    shippingAddress.postalCode,
    shippingAddress.contactInfo?.countryCode,
    shippingAddress.contactInfo?.phoneNumber,
  ];
  if (fields.some((field) => isEmptyString(field))) {
    throw new ApiError(400, 'All shipping address fields must be filled.');
  }

  const processedItems = orderItems.map((x) => ({
    ...x,
    med: x.med,
    subTotal: x.qty * x.price,
  }));
  // Calculate itemsPrice (sum of subtotals)
  const itemsPrice = processedItems.reduce(
    (acc, item) => acc + item.subTotal,
    0
  );

  // Calculate tax & shipping (if needed)
  const taxPrice = itemsPrice * 0.05; // 5% GST example
  const shippingPrice = itemsPrice > 500 ? 0 : 50;

  // Final totalPrice
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const order = new Order({
    orderItems: processedItems,
    orderBy: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });
  const createdOrder = await order.save();

  res.json(new ApiResponse(201, createdOrder, 'Order Created Successfully..'));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderBy: req.user._id });
  res.json(new ApiResponse(200, orders, 'Orders fetched successfully'));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'orderBy',
    'name email'
  );

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  res.json(new ApiResponse(200, order, 'Order fetched successfully'));
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.isDelivered) {
    throw new ApiError(400, 'Order is already delivered');
  }

  order.isDelivered = true;
  order.deliveredAt = new Date();
  order.orderStatus = 'Delivered';

  const updatedOrder = await order.save();

  res.json(
    new ApiResponse(200, updatedOrder, 'Delivered order update successfully')
  );
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(400, 'Order not found.');
  }
  if (order.orderStatus === 'Delivered') {
    throw new ApiError(400, 'Delivered orders cannot be cancelled.');
  }

  if (order.orderStatus === 'Cancelled') {
    throw new ApiError(400, 'Order is already cancelled.');
  }

  order.orderStatus = 'Cancelled';
  await order.save();

  res.json(200, order, 'Order Cancelled Successfully.');
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate('orderBy', 'id name email');

  res.json(new ApiResponse(200, orders, 'Orders fetched successfully'));
});

const MakePayment = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not Found.');
  }
  for (let item of order.orderItems) {
    const medicine = await Medicine.findById(item.med);
    if (!medicine) {
      throw new ApiError(404, `Medicine not found ${item.med}`);
    }
    if (medicine.countInStock < item.qty) {
      throw new ApiError(400, `${medicine.name} is Out of Stock`);
    }
  }

  const formData = {
    amount: order.totalPrice * 100,
    currency: 'INR',
    receipt: order._id.toString(),

    notes: {
      name: order.shippingAddress.name,
      phone: order.shippingAddress.contactInfo.phoneNumber,
      address: order.shippingAddress.address,
      city: order.shippingAddress.city,
    },
    payment_capture: 1,
  };

  const razorpayOrder = await razorpay.orders.create(formData);
  if (!razorpayOrder) {
    throw new ApiError(500, 'Failed to create Razorpay order.');
  }
  order.paymentResult.paymentOrderId = razorpayOrder.id;
  order.paymentResult.status = 'created';
  await order.save();

  res.json(
    new ApiResponse(200, razorpayOrder, 'Razorpay Order Created Successfully.')
  );
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');
    if (receivedSignature !== expectedSignature) {
      return res.json(
        new ApiResponse(
          200,
          null,
          'Webhook received but Signature verification failed.'
        )
      );
    }
    const event = req.body.event;
    const payment = req.body.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const order = await Order.findOne({
      'paymentResult.paymentOrderId': razorpayOrderId,
    }).session(session);
    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    if (event === 'payment.failed') {
      order.isPaid = false;
      order.paymentResult.status = 'failed';
      await order.save({ session });

      console.log('Payment failed for order:', razorpayOrderId);
      return res.status(200).json({ message: 'Payment failed handled.' });
    }

    if (event !== 'payment.captured') {
      return res.json(new ApiResponse(200, null, 'Event ignored.'));
    }
    const paymentId = payment.id;

    if (order.paymentResult.isPaid) {
      await session.abortTransaction();
      console.log('Webhook already processed for order:', razorpayOrderId);
      return res.json(new ApiResponse(200, null, 'Already processed.'));
    }

    for (const item of order.orderItems) {
      const medicine = await Medicine.findById(item.med).session(session);
      if (!medicine) {
        throw new ApiError(404, 'Medicine not Found.');
      }
      if (medicine.countInStock < item.qty) {
        throw new ApiError(400, `Insufficient stock for: ${medicine.name}.`);
      }
      medicine.countInStock -= item.qty;
      await medicine.save({ session });
    }
    order.paymentResult.status = 'paid';
    order.paymentResult.isPaid = true;
    order.paymentResult.paidAt = Date.now();
    order.paymentResult.paymentId = paymentId;
    await order.save({ session });
    await session.commitTransaction();

    console.log('Payment captured for order:', razorpayOrderId);
    res.json(
      new ApiResponse(200, { status: 'Paid' }, 'Order paid Successfully.')
    );
  } catch (error) {
    //Rollback all changes if any error
    console.error('Razorpay Webhook Processing Error:', error);
    if (session) await session.abortTransaction();
    res.json(
      new ApiResponse(
        200,
        null,
        'Webhook received, but an internal error occurred. The issue has been logged for review.'
      )
    );
  } finally {
    if (session) await session.endSession();
  }
});

export {
  addOrderItems,
  getMyOrders,
  MakePayment,
  razorpayWebhook,
  getOrderById,
  updateOrderToDelivered,
  getOrders,
  cancelOrder,
};
