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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    contactInfo: {
      type: String,
      required: true,
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
