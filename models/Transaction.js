import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 100,
    },
    division: {
      type: String,
      enum: ['Personal', 'Office'],
      required: true,
    },
    account: {
      type: String,
      enum: ['Cash', 'Bank', 'Wallet'],
      required: true,
    },
    fromAccount: {
      type: String,
      enum: ['Cash', 'Bank', 'Wallet'],
    },
    toAccount: {
      type: String,
      enum: ['Cash', 'Bank', 'Wallet'],
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(Date.now()),
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, transactionDate: -1 });

export default mongoose.model('Transaction', transactionSchema);
