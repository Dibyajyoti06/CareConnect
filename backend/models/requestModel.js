import mongoose from "mongoose";

const requestSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    requestItems: [
      {
        name: { type: String },
        age: { type: String },
        date: { type: Date },
        group: { type: String },
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
        unit: { type: Number },
        hospital: { type: String },
      },
    ],
    availableDonor: [
      {
        number: { type: String },
      }
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RequestBlood = mongoose.model("RequestBlood", requestSchema);

export default RequestBlood;
