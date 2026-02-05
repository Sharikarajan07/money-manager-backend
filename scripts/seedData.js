import mongoose from 'mongoose';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const email = 'shaarika.rajan@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        console.log(`Seeding data for user: ${user.name} (${user._id})`);

        // Clear existing data for this user
        await Transaction.deleteMany({ userId: user._id });
        await Account.deleteMany({ userId: user._id });

        // Create Accounts with initial 0 balance (will update based on transactions)
        const accounts = await Account.insertMany([
            { userId: user._id, accountName: 'Cash', balance: 0 },
            { userId: user._id, accountName: 'Bank', balance: 0 },
            { userId: user._id, accountName: 'Wallet', balance: 0 },
        ]);

        // Helper to get account ID (not needed strictly as we store account name in Transaction model, but good for logic)
        // Actually Transaction model stores `account` string, not reference.

        const transactions = [
            {
                userId: user._id,
                type: 'income',
                amount: 80000,
                category: 'Salary',
                description: 'Monthly Salary',
                division: 'Office',
                account: 'Bank',
                transactionDate: new Date(),
            },
            {
                userId: user._id,
                type: 'expense',
                amount: 15000,
                category: 'Rent',
                description: 'Apartment Rent',
                division: 'Personal',
                account: 'Bank',
                transactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            },
            {
                userId: user._id,
                type: 'expense',
                amount: 3000,
                category: 'Groceries',
                description: 'Supermarket shopping',
                division: 'Personal',
                account: 'Cash',
                transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            },
            {
                userId: user._id,
                type: 'income',
                amount: 15000,
                category: 'Freelance',
                description: 'Project Payment',
                division: 'Personal',
                account: 'Wallet',
                transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
            {
                userId: user._id,
                type: 'expense',
                amount: 500,
                category: 'Transport',
                description: 'Taxi',
                division: 'Personal',
                account: 'Cash',
                transactionDate: new Date(),
            },
        ];

        await Transaction.insertMany(transactions);
        console.log('Transactions created');

        // Calculate balances
        // Bank: 80000 (Income) - 15000 (Expense) = 65000
        // Cash: -3000 (Expense) - 500 (Expense) = -3500 (Assuming 0 start) -> Actually let's assume some opening balance was there? 
        // Or just let it be negative? The user said "add sample data". 
        // Usually accounts have some starting balance. Let's add an "Opening Balance" income for Cash and Wallet.

        // Let's adjust transactions to make sense.
        // Add "Opening Balance" for Cash
        const openingCash = {
            userId: user._id,
            type: 'income',
            amount: 5000,
            category: 'Others',
            description: 'Opening Balance',
            division: 'Personal',
            account: 'Cash',
            transactionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        };

        await Transaction.create(openingCash);
        transactions.push(openingCash);

        // Update Account Balances
        // We can aggregate or just calculate manually here since we know what we added.

        const accountBalances = {
            'Cash': 0,
            'Bank': 0,
            'Wallet': 0
        };

        for (const txn of transactions) {
            if (txn.type === 'income') {
                accountBalances[txn.account] += txn.amount;
            } else if (txn.type === 'expense') {
                accountBalances[txn.account] -= txn.amount;
            }
        }

        for (const [name, bal] of Object.entries(accountBalances)) {
            await Account.findOneAndUpdate(
                { userId: user._id, accountName: name },
                { balance: bal }
            );
        }

        console.log('Account balances updated');
        console.log('Data seeding completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
