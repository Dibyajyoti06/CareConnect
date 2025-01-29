import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
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

const Requst = mongoose.model('Request', requestSchema);

export default Requst;
