import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientFullName: {
      type: String,
      required: true,
    },
    patientDateOfBirth: {
      type: Date,
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
    hospitalName: {
      type: String,
      required: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
   medicalReports: {
      type: [String],
      required: true
    },
    contributions: [
      {
        contributor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', requestSchema);

export default Request;
