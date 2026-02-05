# Money Manager Backend

Production-ready Express.js backend for Money Manager application with MongoDB and JWT authentication.

## Features

- User authentication with JWT and bcrypt password hashing
- Complete CRUD operations for transactions
- Account management with multi-account support
- Transaction filtering and analytics
- 12-hour edit window for transactions
- Account transfers with automatic balance updates
- Category-wise and division-wise analytics
- Monthly breakdown reports

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcryptjs
- **Validation**: Built-in input validation

## Project Structure

```
backend/
├── models/
│   ├── User.js          # User schema with password hashing
│   ├── Transaction.js   # Transaction schema
│   └── Account.js       # Account balance tracking
├── routes/
│   ├── auth.js          # Authentication endpoints
│   ├─��� transactions.js  # Transaction CRUD & filters
│   ├── analytics.js     # Analytics endpoints
│   └── accounts.js      # Account transfer endpoints
├── middleware/
│   └── auth.js          # JWT protection middleware
├── server.js            # Main application
├── package.json
└── .env.example
```

## Installation & Setup

### Prerequisites

- Node.js (v16+)
- MongoDB Atlas account
- npm or yarn

### Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and create a new cluster
3. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/money-manager?retryWrites=true&w=majority`

### Step 2: Setup Environment

```bash
# Clone repository
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/money-manager?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 3: Run Development Server

```bash
# Install nodemon globally (optional)
npm install -g nodemon

# Start development server
npm run dev

# Or run directly
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Transactions

- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/dashboard/summary` - Get dashboard data
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction (12 hours only)
- `DELETE /api/transactions/:id` - Delete transaction

### Analytics

- `GET /api/analytics/category-summary` - Category-wise expenses
- `GET /api/analytics/division-summary` - Division-wise expenses
- `GET /api/analytics/monthly-breakdown` - Monthly income/expense

### Accounts

- `GET /api/accounts` - Get all accounts
- `POST /api/accounts/transfer` - Transfer between accounts

## API Example Usage

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Add Expense

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "expense",
    "amount": 500,
    "category": "food",
    "description": "Lunch at restaurant",
    "division": "Personal",
    "account": "Cash",
    "transactionDate": "2024-01-15T12:30:00Z"
  }'
```

## Error Handling

All errors return proper HTTP status codes:
- `400` - Bad request / validation error
- `401` - Unauthorized / invalid token
- `403` - Forbidden / not authorized for resource
- `404` - Not found
- `500` - Server error

## Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with expiration
- CORS enabled for frontend domain
- Input validation on all endpoints
- User isolation (users can only see their own data)

## Deployment (Render)

1. Push code to GitHub
2. Connect GitHub to Render
3. Create new Web Service
4. Set environment variables
5. Deploy automatically

## Notes

- All timestamps stored in UTC
- Transactions can only be edited within 12 hours of creation
- Account balances auto-update on transaction changes
- Edit restrictions apply to all transaction types
