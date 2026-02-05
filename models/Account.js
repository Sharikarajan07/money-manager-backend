import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountName: {
      type: String,
      enum: ['Cash', 'Bank', 'Wallet'],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      // Removed min: 0 to allow negative balances for expense tracking
    },
    createdAt: {
      type: Date,
      default: () => new Date(Date.now()),
    },
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1, accountName: 1 }, { unique: true });

export default mongoose.model('Account', accountSchema);
