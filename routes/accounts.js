import express from 'express';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all accounts
router.get('/', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId });
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error: error.message });
  }
});

// Create a new account
router.post('/', protect, async (req, res) => {
  try {
    const { accountName, initialBalance = 0 } = req.body;

    if (!accountName || !['Cash', 'Bank', 'Wallet'].includes(accountName)) {
      return res.status(400).json({ message: 'Please provide a valid account name (Cash, Bank, or Wallet)' });
    }

    // Check if account already exists
    const existingAccount = await Account.findOne({ userId: req.userId, accountName });
    if (existingAccount) {
      return res.status(400).json({ message: 'Account already exists' });
    }

    const account = await Account.create({
      userId: req.userId,
      accountName,
      balance: initialBalance,
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
});

// Transfer between accounts
router.post('/transfer', protect, async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;

    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    let source = await Account.findOne({ userId: req.userId, accountName: fromAccount });
    let destination = await Account.findOne({ userId: req.userId, accountName: toAccount });

    if (!source) {
      source = await Account.create({
        userId: req.userId,
        accountName: fromAccount,
        balance: 0,
      });
    }

    if (!destination) {
      destination = await Account.create({
        userId: req.userId,
        accountName: toAccount,
        balance: 0,
      });
    }

    if (source.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance in source account' });
    }

    source.balance -= amount;
    destination.balance += amount;

    await source.save();
    await destination.save();

    // Record transfer as transaction
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'transfer',
      amount,
      category: 'transfer',
      description: `Transfer from ${fromAccount} to ${toAccount}`,
      division: 'Personal',
      account: fromAccount,
      fromAccount,
      toAccount,
      transactionDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Transfer successful',
      data: { transaction, source, destination },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error transferring funds', error: error.message });
  }
});

export default router;
