import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        med: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Medicine',
        },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      contactInfo: {
        countryCode: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^\+\d{1,3}$/.test(v);
            },
            message: 'Invalid country code format (e.g., +91, +1, +44).',
          },
        },
        phoneNumber: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              // Ensure exactly 10 digits
              return /^\d{10}$/.test(v);
            },
            message: 'Phone number must be exactly 10 digits.',
          },
        },
      },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;