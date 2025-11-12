import mongoose from "mongoose";

const appointmentSchema = mongoose.Schema(
  {
    time: { type: Date },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    appointmentItems: [
      {
        name: { type: String, required: true },
        image: { type: String, required: true },
        chamber: { type: String, required: true },
        degree: { type: [String], required: true },
        tag: { type: String, required: true },
        available: { type: String, required: true },
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Doctor",
        },
      },
    ],
    location: {
      address: { type: String, required: true },
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
    isApproved: {
      type: Boolean,
      required: true,
      default: false,
    },
    ApprovedAt: {
      type: Date,
      default: null
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
