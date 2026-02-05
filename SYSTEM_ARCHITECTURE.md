# Money Manager - Complete System Architecture

## Overview

Money Manager is a full-stack web application for managing personal and office finances with multi-account support, transaction tracking, analytics, and reporting.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         React Frontend (Vite + Tailwind + Recharts)     │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Pages: Login, Dashboard, Filters, Analytics, Accounts
│  │  │ Components: Modal, Charts, History, Layout          │ │   │
│  │  │ Context: Auth, Transactions                         │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (Axios + JWT)
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Server)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Express.js API Server                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Routes:                                             │ │   │
│  │  │  • /api/auth (register, login, getMe)              │ │   │
│  │  │  • /api/transactions (CRUD, filters, dashboard)    │ │   │
│  │  │  • /api/analytics (category, division, monthly)    │ │   │
│  │  │  • /api/accounts (list, transfer)                  │ │   │
│  │  │                                                     │ │   │
│  │  │ Middleware:                                         │ │   │
│  │  │  • JWT authentication & authorization              │ │   │
│  │  │  • CORS configuration                              │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (Mongoose)
┌─────────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Database)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Collections:                                             │   │
│  │  • users (id, name, email, password_hash, timestamps)   │   │
│  │  • transactions (user, type, amount, category, ...)     │   │
│  │  • accounts (userId, accountName, balance)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: 'income' | 'expense' | 'transfer',
  amount: Number,
  category: String,
  description: String,
  division: 'Personal' | 'Office',
  account: 'Cash' | 'Bank' | 'Wallet',
  fromAccount: String (for transfers),
  toAccount: String (for transfers),
  transactionDate: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- userId + createdAt (dashboard queries)
- userId + transactionDate (filtering)
```

### Account Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  accountName: 'Cash' | 'Bank' | 'Wallet',
  balance: Number,
  createdAt: Date,
  updatedAt: Date
}

Unique Index: userId + accountName
```

## Authentication Flow

```
1. User Registration
   ├─ Client: POST /auth/register {name, email, password}
   ├─ Server: Hash password with bcrypt (10 rounds)
   ├─ Server: Create user in DB
   ├─ Server: Generate JWT token
   └─ Client: Store token in localStorage

2. User Login
   ├─ Client: POST /auth/login {email, password}
   ├─ Server: Find user by email
   ├─ Server: Compare password with bcrypt
   ├─ Server: Generate JWT token
   └─ Client: Store token in localStorage

3. Protected Requests
   ├─ Client: Include "Authorization: Bearer {token}" header
   ├─ Server Middleware: Verify JWT token
   ├─ Server: Extract userId from token
   └─ Proceed or return 401 if invalid

4. Logout
   └─ Client: Remove token from localStorage & state
```

## Transaction Management

### Add Transaction
```
1. User fills form → Modal validation
2. POST /api/transactions {type, amount, category, ...}
3. Server creates transaction document
4. Server updates account balance
5. Context state updates immediately
6. Toast notification shown
```

### Edit Transaction (12-hour window)
```
1. Server checks: (now - createdAt) <= 12 hours
2. If expired: Return 403 with "Editing period expired"
3. If valid: Update transaction + update related account
4. Context state updates
```

### Delete Transaction
```
1. Server deletes transaction
2. Server reverses account balance change
3. Context removes from state
```

## Account Transfer Flow

```
1. User selects from/to accounts and amount
2. POST /api/accounts/transfer {fromAccount, toAccount, amount}
3. Server validates:
   ├─ Accounts exist (create if not)
   ├─ Source has sufficient balance
   └─ Different accounts selected
4. Server updates both accounts:
   ├─ source.balance -= amount
   └─ destination.balance += amount
5. Server creates transfer transaction record
6. Response includes updated accounts
7. Frontend updates state and shows success
```

## Analytics Calculation

### Category-wise Expenses
```
Aggregate all transactions where:
- userId = current user
- type = 'expense'
Group by category, sum amounts
```

### Division-wise Expenses
```
Aggregate all transactions where:
- userId = current user
- type = 'expense'
Group by division (Personal/Office), sum amounts
```

### Monthly Breakdown
```
Aggregate all transactions where:
- userId = current user
- type != 'transfer'
Group by month, sum by type (income/expense)
```

## State Management (Context API)

### AuthContext
```
State:
- user: {id, name, email}
- token: JWT token string
- isLoading: boolean
- error: error message

Methods:
- register(name, email, password)
- login(email, password)
- logout()
```

### TransactionContext
```
State:
- transactions: []
- dashboardData: {totalIncome, totalExpenses, balance, transactions}
- isLoading: boolean
- error: error message

Methods:
- fetchTransactions(filters)
- fetchDashboard(period)
- addTransaction(data)
- updateTransaction(id, data)
- deleteTransaction(id)
```

### ToastContext
```
State:
- toasts: [{id, message, type, duration}]

Methods:
- addToast(message, type, duration)
- removeToast(id)
```

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                    [Protected]
```

### Transactions
```
GET    /api/transactions                [Protected]
POST   /api/transactions                [Protected]
PUT    /api/transactions/:id            [Protected, 12hr limit]
DELETE /api/transactions/:id            [Protected]
GET    /api/transactions/dashboard/summary [Protected]
```

### Analytics
```
GET    /api/analytics/category-summary  [Protected]
GET    /api/analytics/division-summary  [Protected]
GET    /api/analytics/monthly-breakdown [Protected]
```

### Accounts
```
GET    /api/accounts                    [Protected]
POST   /api/accounts/transfer           [Protected]
```

## Security Measures

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Never return password in response
   - Use .select('+password') for authentication only

2. **Authentication**
   - JWT tokens with expiration (7 days default)
   - Token stored in browser localStorage
   - Automatic logout on 401 response

3. **Authorization**
   - Middleware verifies JWT on protected routes
   - User data isolation: `userId: req.userId` on all queries
   - Users can only access their own data

4. **Data Validation**
   - Required field validation
   - Amount validation (> 0)
   - Email format validation
   - Category/account enum validation

5. **CORS**
   - Configured for frontend domain
   - Prevents cross-origin attacks

## Deployment Architecture

### Backend (Render.com)
```
1. Push code to GitHub
2. Connect Render to GitHub
3. Create new Web Service
4. Environment variables:
   - MONGODB_URI
   - JWT_SECRET
   - FRONTEND_URL
5. Auto-deploy on push
6. Live at https://money-manager-api.render.com
```

### Frontend (Vercel)
```
1. Push code to GitHub
2. Connect Vercel to GitHub
3. Environment variables:
   - VITE_API_URL=https://money-manager-api.render.com/api
4. Auto-deploy on push
5. Live at https://money-manager.vercel.app
```

## Performance Optimizations

1. **Database**
   - Indexes on frequently queried fields
   - Proper schema design for aggregations

2. **Frontend**
   - Code splitting via Vite
   - Context optimization (separate contexts)
   - Memoized callbacks
   - Efficient re-renders

3. **API**
   - No N+1 queries
   - Pagination-ready structure
   - Efficient aggregation pipelines

## Error Handling

| Status | Meaning | Example |
|--------|---------|---------|
| 400 | Bad Request | Missing fields, invalid data |
| 401 | Unauthorized | Invalid token, expired session |
| 403 | Forbidden | 12-hour edit window expired |
| 404 | Not Found | Transaction/account doesn't exist |
| 500 | Server Error | Database connection failed |

## Key Business Logic

1. **Transaction Editing Restriction**
   - Calculated as: `(now - createdAt) / (1000 * 60 * 60) > 12`
   - Applies to all transaction types
   - Cannot be bypassed, only delete available after 12 hours

2. **Account Balance Tracking**
   - Updated on every transaction add/edit/delete
   - Income: balance += amount
   - Expense: balance -= amount
   - Transfer: both accounts updated atomically

3. **Dashboard Period Selection**
   - Weekly: Last 7 days
   - Monthly: Current month (default)
   - Yearly: Current year
   - Recalculates on period change

4. **User Data Isolation**
   - All queries filtered by userId
   - Each user sees only their data
   - No cross-user data leakage possible

## Testing Checklist

- [ ] User can register with new account
- [ ] User can login with correct credentials
- [ ] User cannot login with wrong password
- [ ] User sees 404 for invalid token
- [ ] Dashboard shows correct calculations
- [ ] Can add income/expense in modal
- [ ] Edit button available within 12 hours
- [ ] Edit button disabled after 12 hours
- [ ] Filters work correctly
- [ ] Analytics charts load and display data
- [ ] Account transfer updates both balances
- [ ] Transaction deletes correctly
- [ ] Account transfers appear in history
- [ ] Mobile layout responsive
- [ ] Toast notifications display
- [ ] Logout clears session

## Future Enhancements

1. Recurring transactions
2. Budget limits & alerts
3. Bill splitting
4. Export to CSV/PDF
5. Mobile app with React Native
6. Two-factor authentication
7. Transaction categorization ML
8. Real-time notifications
9. Scheduled transactions
10. Multi-currency support
