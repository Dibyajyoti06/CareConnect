import mongoose from "mongoose";

const bloodSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    group: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    lastdonate: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
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
  {
    timestamps: true,
  }
);

const Blood = mongoose.model("Blood", bloodSchema);

export default Blood;