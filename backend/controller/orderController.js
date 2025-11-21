import asyncHandler from '../middleware/asyncHandler.js';
import Medicine from '../models/medModel.js';
import Order from '../models/orderModel.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

const updateOrderToPaid = async (order, paymentData) => {
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = paymentData;
  // order.paymentResult = {
  //   id: req.body.id,
  //   status: req.body.status,
  //   update_time: req.body.update_time,
  //   email_address: req.body.payer.email_address,
  // };

  const updatedOrder = await order.save();
  res.json(200, updatedOrder, 'Order paid Successfully.');
};

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
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, 'Order not Found.');
  }
  const id = req.params.id;

  const formData = {
    cus_name: order.shippingAddress.name,
    cus_email: 'test@gmail.com',
    cus_phone: order.shippingAddress.contact,
    amount: order.totalPrice,
    tran_id: uuidv4(),
    signature_key: 'dbb74894e82415a2f7ff0ec3a97e4183',
    store_id: 'test',
    currency: 'INR',
    desc: order.orderItems[0].name,
    cus_add1: order.shippingAddress.address,
    cus_add2: 'Delhi',
    cus_city: 'Delhi',
    cus_country: 'India',
    opt_a: id,
    success_url: 'http://localhost:5000/api/orders/callback',
    fail_url: 'http://localhost:5000/api/orders/callback',
    cancel_url: 'http://localhost:5000/api/orders/callback',
    type: 'json',
  };

  const { data } = await axios.post(
    'https://sandbox.stripe.com/jsonpost.php',
    formData
  );

  if (data.result !== 'true') {
    let errorMessage = '';
    for (let key in data) {
      errorMessage += data[key] + '. ';
    }
    return res.render('error', {
      title: 'Error',
      errorMessage,
    });
  }
  res.json(data);
});

const callback = asyncHandler(async (req, res) => {
  const {
    pay_status,
    cus_name,
    cus_phone,
    cus_email,
    currency,
    pay_time,
    amount,
    opt_a,
  } = req.body;

  const order = await Order.findById(opt_a);

  if (order && pay_status === 'Successful') {
    // order.isPaid = true;
    // order.paidAt = Date.now();

    // await order.save();
    for (const item of order.orderItems) {
      const medicine = await Medicine.findById(item.med);
      if (!medicine) {
        throw new ApiError(404, 'Medicine not Found.');
      }
      medicine.countInStock -= item.qty;
      await medicine.save();
    }

    updateOrderToPaid(order, {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }

  let baseUrl = 'http://localhost:3000';
  let url = '/success';
  let queryParams = `?cus_name=${cus_name}&pay_time=${pay_time}&amount=${amount}&pay_status=${pay_status}&cus_phone=${cus_phone}&currency=${currency}&opt_a=${opt_a}`;
  res.redirect(301, `${baseUrl}${url}/${queryParams}`);
});

export {
  addOrderItems,
  getMyOrders,
  MakePayment,
  callback,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  cancelOrder,
};
