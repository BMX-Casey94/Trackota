# Trackota Pit Strategy Backend (FastAPI)

## Quick start

```bash
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment

Copy `.env.example` to `.env` if needed.

## Endpoints
- GET /strategy/summary
- GET /strategy/recommendations
- GET /race/top3
- GET /charts/tyre-degradation

CORS is enabled for local development.



