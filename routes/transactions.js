import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions
router.get('/', protect, async (req, res) => {
  try {
    const { category, division, account, startDate, endDate, searchDesc } = req.query;

    let query = { userId: req.userId };

    // Use case-insensitive regex for text fields
    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (division) query.division = { $regex: new RegExp(`^${division}$`, 'i') };
    if (account) query.account = { $regex: new RegExp(`^${account}$`, 'i') };
    if (searchDesc) query.description = { $regex: searchDesc, $options: 'i' };

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ transactionDate: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Get dashboard data (income, expenses, balance)
router.get('/dashboard/summary', protect, async (req, res) => {
  try {
    const { period } = req.query; // 'weekly', 'monthly', 'yearly'

    const now = new Date();
    let startDate;

    if (period === 'weekly') {
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      userId: req.userId,
      transactionDate: { $gte: startDate },
      type: { $ne: 'transfer' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const periodBalance = totalIncome - totalExpenses;

    // Get total actual balance from Accounts (Net Worth)
    const accounts = await Account.find({ userId: req.userId });
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance: totalBalance, // Using actual net worth
        periodBalance, // Sending period saving separately if needed
        transactions
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Add transaction
router.post('/', protect, async (req, res) => {
  try {
    const { type, amount, category, description, division, account, transactionDate } = req.body;

    if (!type || !amount || !category || !description || !division || !account || !transactionDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check for insufficient balance before processing
    let accountRecord = await Account.findOne({ userId: req.userId, accountName: account });

    // Create account if not exists
    if (!accountRecord) {
      if (type === 'expense') {
        return res.status(400).json({ message: `Insufficient funds in ${account}. Current balance: ₹0` });
      }
      accountRecord = await Account.create({
        userId: req.userId,
        accountName: account,
        balance: 0,
      });
    }

    if (type === 'expense' && accountRecord.balance < amount) {
      return res.status(400).json({
        message: `Insufficient funds in ${account}. Current balance: ₹${accountRecord.balance.toLocaleString('en-IN')}`
      });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount,
      category,
      description,
      division,
      account,
      transactionDate: new Date(transactionDate),
    });

    if (type === 'income') {
      accountRecord.balance += amount;
    } else if (type === 'expense') {
      accountRecord.balance -= amount;
    }
    await accountRecord.save();

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
});

// Update transaction (only within 12 hours)
router.put('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    const createdTime = new Date(transaction.createdAt);
    const currentTime = new Date();
    const timeDiffHours = (currentTime - createdTime) / (1000 * 60 * 60);

    if (timeDiffHours > 12) {
      return res.status(403).json({ message: 'Editing period expired (12 hours limit)' });
    }

    const { amount, category, description, division, account, transactionDate, type } = req.body;

    // If account changed, update balances
    if (account && account !== transaction.account) {
      const oldAccount = await Account.findOne({ userId: req.userId, accountName: transaction.account });
      const newAccount = await Account.findOne({ userId: req.userId, accountName: account });

      if (oldAccount && transaction.type === 'income') {
        oldAccount.balance -= transaction.amount;
      } else if (oldAccount && transaction.type === 'expense') {
        oldAccount.balance += transaction.amount;
      }

      if (newAccount) {
        if (transaction.type === 'income') {
          newAccount.balance += transaction.amount;
        } else if (transaction.type === 'expense') {
          newAccount.balance -= transaction.amount;
        }
      }

      await oldAccount.save();
      await newAccount.save();
    }

    transaction.amount = amount || transaction.amount;
    transaction.category = category || transaction.category;
    transaction.description = description || transaction.description;
    transaction.division = division || transaction.division;
    transaction.account = account || transaction.account;
    transaction.transactionDate = transactionDate ? new Date(transactionDate) : transaction.transactionDate;

    await transaction.save();

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction', error: error.message });
  }
});

// Delete transaction (only within 12 hours)
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this transaction' });
    }

    // Check 12-hour restriction
    const createdTime = new Date(transaction.createdAt);
    const currentTime = new Date();
    const timeDiffHours = (currentTime - createdTime) / (1000 * 60 * 60);

    if (timeDiffHours > 12) {
      return res.status(403).json({ message: 'Deletion period expired (12 hours limit)' });
    }

    // Update account balance
    const account = await Account.findOne({ userId: req.userId, accountName: transaction.account });
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

export default router;
