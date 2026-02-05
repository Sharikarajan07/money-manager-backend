import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Category-wise expense summary
router.get('/category-summary', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'expense',
    });

    const categoryWise = {};
    transactions.forEach((t) => {
      categoryWise[t.category] = (categoryWise[t.category] || 0) + t.amount;
    });

    res.status(200).json({ success: true, data: categoryWise });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category summary', error: error.message });
  }
});

// Division-wise summary (Personal vs Office)
router.get('/division-summary', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      type: { $ne: 'transfer' },
    });

    const divisionWise = { 
      Personal: { income: 0, expense: 0 },
      Office: { income: 0, expense: 0 }
    };
    
    transactions.forEach((t) => {
      if (t.type === 'income') {
        divisionWise[t.division].income += t.amount;
      } else if (t.type === 'expense') {
        divisionWise[t.division].expense += t.amount;
      }
    });

    res.status(200).json({ success: true, data: divisionWise });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching division summary', error: error.message });
  }
});

// Monthly breakdown
router.get('/monthly-breakdown', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      type: { $ne: 'transfer' },
    });

    const monthlyData = {};
    transactions.forEach((t) => {
      const date = new Date(t.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    res.status(200).json({ success: true, data: monthlyData });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly breakdown', error: error.message });
  }
});

export default router;
