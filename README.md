# BinFlow — Inventory & Purchase Management

A full-stack inventory application built with React, TypeScript, FastAPI, SQLAlchemy and PostgreSQL.

## Features
- Product, category and supplier CRUD
- Stock receipts linked to suppliers
- Stock issues with negative-stock prevention
- Atomic stock balance + movement history updates
- Low-stock dashboard and transaction history
- Search and filtering
- PostgreSQL migrations with Alembic
- Pytest backend tests and Vitest frontend tests
- Separate Vercel deployments for frontend and backend

## Requirements
- Python 3.12
- Node.js 20+
- PostgreSQL 14+
- pgAdmin 4 (database administration)

## 1. Create the local database
In pgAdmin 4, create a database named `binflow_db`, owner `postgres`, encoding UTF8.

## 2. Backend setup (Windows PowerShell)
```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit backend/.env and set your PostgreSQL password
alembic upgrade head
python -m app.seed.seed_data
uvicorn app.main:app --reload
```
API: http://localhost:8000  
Swagger: http://localhost:8000/docs  
Health: http://localhost:8000/health

## 3. Frontend setup
Open a second terminal:
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```
Frontend: http://localhost:5173

## 4. Backend tests
```powershell
cd backend
pytest
```

## 5. Frontend tests
```powershell
cd frontend
npm test
```

## API overview
All business endpoints use `/api/v1`.

- `GET/POST /categories`
- `GET/POST /products`
- `GET/PATCH/DELETE /products/{id}`
- `GET/POST /suppliers`
- `GET/POST /stock/receipts`
- `POST /stock/issues`
- `GET /stock/movements`
- `GET /dashboard/summary`

Receipt request:
```json
{
  "supplier_id": 1,
  "reference_number": "PO-1001",
  "notes": "Opening stock",
  "items": [{"product_id": 1, "quantity": 20, "unit_cost": 12.5}]
}
```

Issue request:
```json
{
  "notes": "Issued to sales floor",
  "items": [{"product_id": 1, "quantity": 3}]
}
```

## Vercel deployment
Deploy the two folders as separate Vercel projects from the same Git repository.

### Backend project
- Root Directory: `backend`
- Framework preset: Other
- Build command: leave default / no frontend build
- Install command: `pip install -r requirements.txt`
- Add environment variables:
  - `DATABASE_URL`: Neon pooled PostgreSQL URL using `postgresql+psycopg://`
  - `CORS_ORIGINS`: exact deployed frontend origin, e.g. `https://binflow-frontend.vercel.app`
  - `APP_ENV=production`
  - `DEBUG=false`
- Run migrations against Neon before using the app:
  ```bash
  alembic upgrade head
  ```

### Frontend project
- Root Directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://YOUR-BACKEND-DOMAIN.vercel.app/api/v1`

Redeploy the frontend after changing `VITE_API_URL`. Vite variables are embedded at build time.

### Neon notes
Use the Neon pooled connection URL for runtime traffic. Keep the direct URL available for running Alembic migrations if required. Never put database URLs in frontend variables. Vercel functions are serverless, so avoid relying on in-memory state or long-lived background tasks.

## Important production notes
- This starter is intended for a single-business inventory deployment.
- Authentication, role-based access, audit-user attribution, CSV exports, and purchase-order approval workflows are future enhancements.
- Stock receipt/issue operations lock product rows and commit stock balances and movement rows together.
- Never manually edit `current_stock` in the database; use stock movement endpoints.
