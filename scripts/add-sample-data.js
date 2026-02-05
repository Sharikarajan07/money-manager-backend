import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';

const MONGO_URI = 'mongodb://localhost:27017/money-manager';

const sampleTransactions = [
  // Personal Income
  { type: 'income', amount: 50000, category: 'salary', division: 'Personal', account: 'Bank', description: 'Monthly Salary' },
  { type: 'income', amount: 5000, category: 'freelance', division: 'Personal', account: 'Bank', description: 'Freelance Project' },
  
  // Personal Expenses
  { type: 'expense', amount: 3000, category: 'food', division: 'Personal', account: 'Cash', description: 'Groceries' },
  { type: 'expense', amount: 2000, category: 'shopping', division: 'Personal', account: 'Wallet', description: 'Clothes' },
  { type: 'expense', amount: 1500, category: 'utilities', division: 'Personal', account: 'Bank', description: 'Electricity Bill' },
  { type: 'expense', amount: 500, category: 'transport', division: 'Personal', account: 'Cash', description: 'Fuel' },
  { type: 'expense', amount: 800, category: 'movie', division: 'Personal', account: 'Wallet', description: 'Cinema' },
  { type: 'expense', amount: 1200, category: 'medical', division: 'Personal', account: 'Bank', description: 'Pharmacy' },
  { type: 'expense', amount: 300, category: 'fuel', division: 'Personal', account: 'Cash', description: 'Petrol' },
  
  // Office Income
  { type: 'income', amount: 30000, category: 'salary', division: 'Office', account: 'Bank', description: 'Project Payment' },
  { type: 'income', amount: 10000, category: 'freelance', division: 'Office', account: 'Bank', description: 'Consulting Fee' },
  
  // Office Expenses
  { type: 'expense', amount: 5000, category: 'loan', division: 'Office', account: 'Bank', description: 'Office Rent' },
  { type: 'expense', amount: 2000, category: 'utilities', division: 'Office', account: 'Bank', description: 'Internet Bill' },
  { type: 'expense', amount: 3500, category: 'shopping', division: 'Office', account: 'Bank', description: 'Office Supplies' },
  { type: 'expense', amount: 1000, category: 'food', division: 'Office', account: 'Cash', description: 'Team Lunch' },
  { type: 'expense', amount: 500, category: 'transport', division: 'Office', account: 'Wallet', description: 'Cab Fare' },
];

async function addSampleData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // Find first user (you should be logged in)
    const user = await User.findOne();
    if (!user) {
      console.error('No user found. Please register a user first.');
      process.exit(1);
    }

    console.log(`Adding transactions for user: ${user.email}`);

    // Get or create accounts
    let cashAccount = await Account.findOne({ userId: user._id, accountName: 'Cash' });
    let bankAccount = await Account.findOne({ userId: user._id, accountName: 'Bank' });
    let walletAccount = await Account.findOne({ userId: user._id, accountName: 'Wallet' });

    if (!cashAccount) {
      cashAccount = await Account.create({ userId: user._id, accountName: 'Cash', balance: 10000 });
    }
    if (!bankAccount) {
      bankAccount = await Account.create({ userId: user._id, accountName: 'Bank', balance: 50000 });
    }
    if (!walletAccount) {
      walletAccount = await Account.create({ userId: user._id, accountName: 'Wallet', balance: 5000 });
    }

    // Map account names to IDs
    const accountMap = {
      'Cash': cashAccount._id,
      'Bank': bankAccount._id,
      'Wallet': walletAccount._id
    };

    // Add transactions
    for (const txn of sampleTransactions) {
      const transaction = await Transaction.create({
        ...txn,
        userId: user._id,
        transactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      });
      console.log(`Created ${txn.type}: ${txn.description} - ₹${txn.amount}`);
    }

    console.log('\n✅ Sample data added successfully!');
    console.log('Refresh your Analytics page to see the data.');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addSampleData();
