// Script to delete duplicate transactions
// Run with: node scripts/delete-duplicates.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Define schema
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    division: { type: String, enum: ['Personal', 'Office'], default: 'Personal' },
    account: { type: String, enum: ['Cash', 'Bank', 'Wallet'], default: 'Cash' },
    transactionDate: { type: Date, default: Date.now },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moneymanager';

async function deleteDuplicates() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all transactions
        const allTransactions = await Transaction.find().sort({ createdAt: -1 });
        console.log(`📊 Total transactions: ${allTransactions.length}\n`);

        // Group by unique key (description + amount + date + type + account)
        const seen = new Map();
        const duplicatesToDelete = [];

        for (const tx of allTransactions) {
            const key = `${tx.userId}-${tx.description}-${tx.amount}-${tx.type}-${tx.account}-${new Date(tx.transactionDate).toDateString()}`;

            if (seen.has(key)) {
                // This is a duplicate - mark for deletion
                duplicatesToDelete.push(tx._id);
                console.log(`  🔴 Duplicate: "${tx.description}" - ₹${tx.amount} (${tx.type})`);
            } else {
                // First occurrence - keep it
                seen.set(key, tx._id);
                console.log(`  🟢 Keeping: "${tx.description}" - ₹${tx.amount} (${tx.type})`);
            }
        }

        console.log(`\n📋 Summary:`);
        console.log(`   - Unique transactions: ${seen.size}`);
        console.log(`   - Duplicates to delete: ${duplicatesToDelete.length}\n`);

        if (duplicatesToDelete.length > 0) {
            // Delete duplicates
            const result = await Transaction.deleteMany({ _id: { $in: duplicatesToDelete } });
            console.log(`🗑️  Deleted ${result.deletedCount} duplicate transactions!`);
        } else {
            console.log('✨ No duplicates found!');
        }

        // Show remaining count
        const remaining = await Transaction.countDocuments();
        console.log(`\n📊 Remaining transactions: ${remaining}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

deleteDuplicates();
