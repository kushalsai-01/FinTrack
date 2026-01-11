# FinSight AI ML Service

Python FastAPI microservice for AI-powered financial intelligence.

## Features

- **Transaction Categorization**: TF-IDF + Logistic Regression
- **Health Score Computation**: Multi-factor composite scoring
- **Cash Flow Forecasting**: Time-series analysis with confidence bands
- **Anomaly Detection**: Isolation Forest + statistical methods
- **Goal Recommendations**: Pattern-based goal generation
- **Explainable Insights**: Evidence-based financial nudges

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment (copy `.env.example` to `.env`)

4. Run service:
```bash
python run.py
```

Or with uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /api/v1/predict/category` - Predict transaction category
- `POST /api/v1/health/score` - Compute health score
- `POST /api/v1/forecast/generate` - Generate forecast
- `POST /api/v1/anomaly/detect` - Detect anomalies
- `POST /api/v1/goals/recommend` - Recommend goals
- `POST /api/v1/insights/generate` - Generate insights

See `/docs` for interactive API documentation.
