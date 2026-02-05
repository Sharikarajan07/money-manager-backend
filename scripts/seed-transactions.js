// Seed script to add sample transactions
// Run with: node scripts/seed-transactions.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Define schemas inline to avoid import issues
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    division: { type: String, enum: ['Personal', 'Office'], default: 'Personal' },
    account: { type: String, enum: ['Cash', 'Bank', 'Wallet'], default: 'Cash' },
    transactionDate: { type: Date, default: Date.now },
}, { timestamps: true });

const accountSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountName: { type: String, required: true },
    balance: { type: Number, default: 0 },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moneymanager';

const sampleTransactions = [
    // Income transactions - January
    { type: 'income', amount: 50000, category: 'salary', description: 'Monthly Salary - January', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-05') },
    { type: 'income', amount: 5000, category: 'bonus', description: 'Performance Bonus', division: 'Office', account: 'Bank', transactionDate: new Date('2026-01-15') },
    { type: 'income', amount: 10000, category: 'investment', description: 'Dividend Income', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-20') },
    { type: 'income', amount: 3000, category: 'other', description: 'Freelance Work', division: 'Personal', account: 'Wallet', transactionDate: new Date('2026-01-25') },

    // Income transactions - February  
    { type: 'income', amount: 50000, category: 'salary', description: 'Monthly Salary - February', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-02-05') },
    { type: 'income', amount: 8000, category: 'bonus', description: 'Project Bonus', division: 'Office', account: 'Bank', transactionDate: new Date('2026-02-10') },

    // Expense transactions - January
    { type: 'expense', amount: 8000, category: 'food', description: 'Monthly Groceries', division: 'Personal', account: 'Cash', transactionDate: new Date('2026-01-10') },
    { type: 'expense', amount: 4500, category: 'fuel', description: 'Petrol', division: 'Personal', account: 'Cash', transactionDate: new Date('2026-01-12') },
    { type: 'expense', amount: 2500, category: 'utilities', description: 'Electricity Bill', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-08') },
    { type: 'expense', amount: 1500, category: 'utilities', description: 'Internet Bill', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-10') },
    { type: 'expense', amount: 800, category: 'movie', description: 'Cinema Tickets', division: 'Personal', account: 'Wallet', transactionDate: new Date('2026-01-14') },
    { type: 'expense', amount: 12000, category: 'shopping', description: 'New Clothes', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-18') },
    { type: 'expense', amount: 3000, category: 'medical', description: 'Health Checkup', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-22') },
    { type: 'expense', amount: 2000, category: 'transport', description: 'Uber Rides', division: 'Office', account: 'Wallet', transactionDate: new Date('2026-01-25') },
    { type: 'expense', amount: 5000, category: 'loan', description: 'EMI Payment', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-01-28') },

    // Expense transactions - February
    { type: 'expense', amount: 6000, category: 'food', description: 'Restaurant & Groceries', division: 'Personal', account: 'Cash', transactionDate: new Date('2026-02-02') },
    { type: 'expense', amount: 3500, category: 'fuel', description: 'Petrol', division: 'Personal', account: 'Cash', transactionDate: new Date('2026-02-03') },
    { type: 'expense', amount: 5000, category: 'shopping', description: 'Electronics', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-02-01') },
    { type: 'expense', amount: 1800, category: 'transport', description: 'Metro Card Recharge', division: 'Office', account: 'Wallet', transactionDate: new Date('2026-02-02') },
    { type: 'expense', amount: 2200, category: 'utilities', description: 'Gas Bill', division: 'Personal', account: 'Bank', transactionDate: new Date('2026-02-03') },
    { type: 'expense', amount: 1500, category: 'movie', description: 'Netflix & OTT', division: 'Personal', account: 'Wallet', transactionDate: new Date('2026-02-01') },
];

async function seedDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get the first user
        const user = await User.findOne();

        if (!user) {
            console.log('❌ No user found! Please register a user first.');
            process.exit(1);
        }

        console.log(`📝 Adding transactions for user: ${user.name} (${user.email})\n`);

        // Track account balances
        const accountBalances = {};

        for (const transaction of sampleTransactions) {
            // Create transaction
            await Transaction.create({
                ...transaction,
                userId: user._id
            });

            // Update account balance tracking
            const accountName = transaction.account;
            if (!accountBalances[accountName]) {
                accountBalances[accountName] = 0;
            }

            if (transaction.type === 'income') {
                accountBalances[accountName] += transaction.amount;
            } else {
                accountBalances[accountName] -= transaction.amount;
            }

            console.log(`  ✓ Added: ${transaction.type === 'income' ? '📈' : '📉'} ${transaction.description} - ₹${transaction.amount}`);
        }

        // Update account balances in database
        console.log('\n💰 Updating account balances...');
        for (const [accountName, balanceChange] of Object.entries(accountBalances)) {
            await Account.findOneAndUpdate(
                { user: user._id, accountName },
                { $inc: { balance: balanceChange } },
                { upsert: true, new: true }
            );
            console.log(`  ✓ ${accountName}: ${balanceChange >= 0 ? '+' : ''}₹${balanceChange}`);
        }

        console.log('\n✅ Sample data added successfully!');
        console.log('🌐 Visit http://localhost:5173/analytics to see the charts');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedDatabase();
