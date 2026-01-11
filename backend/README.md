# FinSight AI Backend

Production-grade Node.js/Express backend for FinSight AI personal finance platform.

## Architecture

- **Layered Architecture**: Routes → Controllers → Services → Repositories
- **Database**: MongoDB with Mongoose
- **Cache**: Redis for computed metrics
- **Authentication**: JWT with refresh tokens
- **Background Jobs**: Cron-based scheduled tasks

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (copy `.env.example` to `.env`)

3. Start MongoDB and Redis services

4. Run seed script (optional):
```bash
npm run seed
```

5. Start server:
```bash
npm run dev  # Development
npm start    # Production
```

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Transactions
- `POST /transactions` - Create transaction
- `GET /transactions` - List transactions (with filters)
- `GET /transactions/:id` - Get transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Categories
- `POST /categories` - Create category
- `GET /categories` - List categories
- `GET /categories/:id` - Get category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Analytics
- `GET /analytics/monthly` - Monthly summary
- `GET /analytics/category-breakdown` - Category totals
- `GET /analytics/budget-progress` - Budget vs actual
- `GET /analytics/trends` - Historical trends

### Health Score
- `POST /health/compute` - Compute health score
- `GET /health/latest` - Get latest score
- `GET /health/history` - Score history

### Forecasts
- `POST /forecast/generate` - Generate forecast
- `GET /forecast/latest` - Get latest forecast
- `GET /forecast/all` - All forecasts

### Goals
- `POST /goals` - Create goal
- `GET /goals` - List goals
- `POST /goals/generate-recommendations` - AI recommendations
