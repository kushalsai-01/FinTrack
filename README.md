# FinSight AI - Personal Finance Intelligence Platform

A production-grade, end-to-end AI-powered personal finance platform with explainable intelligence, predictive analytics, and behavioral insights.

## 🏗️ Architecture Overview

FinSight AI is built in **layers** with clean separation of concerns:

1. **Base Layer**: Complete personal finance application (transactions, categories, budgets, analytics)
2. **Intelligence Layer**: Automatic transaction categorization using ML
3. **AI Layer**: Predictive forecasting, health scoring, anomaly detection, and goal recommendations

### System Architecture

```
┌─────────────────┐
│   React Frontend │  (Port 3000)
│   Tailwind CSS  │
│   Zustand       │
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  Node.js Backend │  (Port 3001)
│   Express.js     │
│   MongoDB        │
│   Redis          │
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  Python ML Service│  (Port 8000)
│   FastAPI        │
│   scikit-learn   │
│   TensorFlow     │
└──────────────────┘
```

## 📁 Project Structure

```
FinTrack 2/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/       # Database, Redis config
│   │   ├── models/       # Mongoose schemas
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   ├── controllers/  # HTTP handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation
│   │   ├── jobs/         # Background cron jobs
│   │   └── utils/        # Helpers, errors, JWT
│   └── package.json
│
├── ml-service/           # Python FastAPI ML service
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # ML algorithms
│   │   ├── models/       # Pydantic schemas
│   │   └── config.py     # Settings
│   └── requirements.txt
│
└── frontend/             # React frontend
    ├── src/
    │   ├── pages/        # Page components
    │   ├── components/   # Reusable components
    │   ├── store/        # Zustand state
    │   └── services/     # API client
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB
- Redis (optional, for caching)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm run seed  # Optional: seed sample data
npm run dev
```

Backend runs on `http://localhost:3001`

### 2. ML Service Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

ML service runs on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 🔑 Key Features

### Base Application (Foundation)

1. **Authentication & Users**
   - JWT access tokens + refresh tokens
   - Secure password hashing (bcrypt)
   - User profiles with income and preferences

2. **Transaction Management**
   - Add/edit/delete income and expenses
   - Filter by date, category, type
   - Payment method tracking
   - Notes and descriptions

3. **Automatic Categorization**
   - AI-powered category prediction
   - Needs vs Wants classification
   - Confidence scores
   - User override capability

4. **Categories & Budgets**
   - Default categories (14 pre-configured)
   - Custom user categories
   - Monthly budget per category
   - Budget vs actual tracking

5. **Basic Analytics**
   - Monthly income/expense summaries
   - Category breakdowns
   - Savings calculations
   - Trend analysis

### Intelligence & AI Layer

6. **Financial Health Score**
   - Composite score (0-100)
   - Sub-scores: savings rate, volatility, income/expense ratio, budget adherence, anomalies
   - Human-readable explanations
   - Actionable recommendations
   - Computed daily via background jobs

7. **Time-Series Forecasting**
   - 7-day, 14-day, 30-day cash flow predictions
   - Confidence bands
   - Risk indicators
   - LSTM-ready architecture

8. **Anomaly Detection**
   - Isolation Forest + statistical methods
   - Detects spending spikes, unusual patterns
   - Risk level assessment
   - Alert generation

9. **Goal Recommendation Engine**
   - AI-generated financial goals
   - Evidence-based recommendations
   - Rule + ML hybrid approach
   - Progress tracking

10. **Explainable Insights**
    - Natural language financial nudges
    - Data-driven insights
    - Evidence-based reasoning
    - Priority-based recommendations

## 🔄 Data Flow

### Transaction Creation Flow

1. User creates transaction (frontend)
2. Backend receives request
3. If no category provided → Backend calls ML service `/predict/category`
4. ML service returns: category, needsVsWants, confidence, reasoning
5. Backend stores transaction with AI predictions
6. User can override predictions (logged for retraining)

### Health Score Computation Flow

1. Background job runs daily at 2 AM
2. Fetches last 90 days of transactions for each user
3. Calls ML service `/health/score`
4. ML service computes:
   - Savings rate score
   - Spending volatility score
   - Income/expense ratio score
   - Budget adherence score
   - Anomaly score
5. Weighted overall score calculated
6. Explanation and recommendations generated
7. Stored in database with full explainability

### Forecast Generation Flow

1. Background job runs daily at 3 AM
2. Fetches transaction history (minimum 60 days)
3. Calls ML service `/forecast/generate`
4. ML service:
   - Analyzes time-series patterns
   - Generates predictions with confidence bands
   - Calculates risk score
5. Forecast stored in database
6. Frontend displays forecast with risk indicators

## 🧠 ML Algorithms & Explainability

### Category Prediction
- **Algorithm**: TF-IDF + Logistic Regression
- **Features**: Transaction description, amount, payment method
- **Output**: Category, needsVsWants, confidence, reasoning
- **Explainability**: Human-readable reasoning for each prediction

### Health Score
- **Algorithm**: Multi-factor weighted scoring
- **Factors**:
  - Savings Rate (25% weight)
  - Spending Volatility (20% weight)
  - Income/Expense Ratio (25% weight)
  - Budget Adherence (20% weight)
  - Anomaly Score (10% weight)
- **Explainability**: Sub-scores, explanation, recommendations

### Forecasting
- **Algorithm**: Moving average + trend analysis (LSTM-ready)
- **Features**: Daily cash flow, trend, seasonality
- **Output**: Predictions with confidence bands, risk score
- **Explainability**: Risk indicators, confidence levels

### Anomaly Detection
- **Algorithm**: Isolation Forest + Z-score analysis
- **Features**: Amount, date, category
- **Output**: Anomaly list with scores, reasons, severity
- **Explainability**: Human-readable reasons for each anomaly

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers
- Input validation with express-validator
- Environment-based configuration

## 📊 Background Jobs

- **Health Score Job**: Runs daily at 2 AM
- **Forecast Job**: Runs daily at 3 AM
- **Goal Progress Job**: Runs every 6 hours

## 🧪 Testing

### Sample Data

Run the seed script to create test user and transactions:
```bash
cd backend
npm run seed
```

Test credentials:
- Email: `test@finsight.ai`
- Password: `Test1234!`

## 📝 API Documentation

### Backend API

All endpoints prefixed with `/api/v1`

- **Auth**: `/auth/*` - Registration, login, profile
- **Transactions**: `/transactions/*` - CRUD operations
- **Categories**: `/categories/*` - Category management
- **Analytics**: `/analytics/*` - Financial analytics
- **Health**: `/health/*` - Health score endpoints
- **Forecast**: `/forecast/*` - Forecast endpoints
- **Goals**: `/goals/*` - Goal management

### ML Service API

All endpoints prefixed with `/api/v1`

- `POST /predict/category` - Category prediction
- `POST /health/score` - Health score computation
- `POST /forecast/generate` - Forecast generation
- `POST /anomaly/detect` - Anomaly detection
- `POST /goals/recommend` - Goal recommendations
- `POST /insights/generate` - Insights generation

Interactive docs available at:
- Backend: `http://localhost:3001/health`
- ML Service: `http://localhost:8000/docs`

## 🏗️ Architecture Decisions

### Why Layered Architecture?

- **Separation of Concerns**: Business logic separate from HTTP handling
- **Testability**: Easy to unit test services and repositories
- **Scalability**: Can scale layers independently
- **Maintainability**: Clear boundaries and responsibilities

### Why Separate ML Service?

- **Language Choice**: Python ecosystem for ML (scikit-learn, TensorFlow)
- **Scalability**: Can scale ML service independently
- **Technology Isolation**: ML models can be updated without affecting backend
- **Resource Management**: ML computations can run on GPU-enabled servers

### Why MongoDB?

- **Flexibility**: Schema evolution for financial data
- **Aggregations**: Powerful pipeline for analytics
- **Performance**: Indexed queries for transactions
- **Scalability**: Horizontal scaling capabilities

### Why Redis?

- **Caching**: Fast access to computed metrics
- **Session Management**: Refresh token storage
- **Performance**: Reduces database load

## 🚀 Production Considerations

1. **Environment Variables**: All secrets in `.env` files
2. **Error Handling**: Centralized error handling with proper logging
3. **Logging**: Winston for structured logging
4. **Database Indexing**: Optimized indexes on common queries
5. **API Rate Limiting**: Prevents abuse
6. **CORS Configuration**: Properly configured for production
7. **Security Headers**: Helmet.js for security
8. **Graceful Shutdown**: Proper cleanup on SIGTERM

## 📈 Future Enhancements

- LSTM models for improved forecasting
- Real-time transaction categorization retraining
- Multi-currency support with conversion
- Bank account integration
- Recurring transaction detection
- Subscription management
- Investment tracking
- Tax reporting


