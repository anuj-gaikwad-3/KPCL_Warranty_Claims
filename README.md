# Indi4 Warranty Intelligence Platform

A unified, full-stack warranty claims analytics platform for Indi4 — combining a multi-page React dashboard, AI-powered chatbot widget, and time-series forecasting into a single deployable application.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Pages & Features](#pages--features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

The platform ingests a cleaned warranty claims master dataset and exposes actionable insights across five analytical dimensions:

| Section | Description |
|---|---|
| **Overview** | YoY trends, monthly/quarterly patterns, model-stage breakdown |
| **Complaints** | Dealer, customer, application and issue-frequency analysis |
| **ZHC Analysis** | Zero Hour Complaints — infant-mortality failure patterns |
| **Usage Analysis** | Machine usage hours, MTTF, failure distribution and RPM heatmap |
| **Forecasting** | ML-based complaint forecasting, model risk, parts demand, cost outlook |
| **AI Chatbot** | Gemini-powered chatbot widget for natural-language warranty queries |

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │    React Frontend (Vite)     │
                    │  Tailwind CSS + Plotly.js    │
                    └──────────┬──────────────────┘
                               │ /api/v1/*
                    ┌──────────▼──────────────────┐
                    │   FastAPI Unified Backend    │
                    │                             │
                    │  /dashboard  → data_engine  │
                    │  /chatbot    → LangChain +  │
                    │               Gemini API    │
                    │  /forecast   → CSV outputs  │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │           Data Layer             │
              │  backend/data/dashboard/*.xlsx   │
              │  backend/data/forecasting/*.csv  │
              │  backend/data/chatbot/           │
              └─────────────────────────────────┘
```

---

## Project Structure

```
Indi4_warranty Claims/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, router mounts
│   │   ├── dashboard/
│   │   │   ├── data_engine.py         # WarrantyDataEngine — all KPIs & chart data
│   │   │   └── routes.py              # /api/v1/dashboard/* endpoints
│   │   ├── chatbot/
│   │   │   ├── routes.py              # /api/v1/chatbot/* endpoints
│   │   │   ├── config.py              # Gemini model config
│   │   │   ├── agents/
│   │   │   │   ├── code_agent.py      # LangChain agent logic
│   │   │   │   └── prompts.py         # System prompts
│   │   │   ├── models/
│   │   │   │   ├── request.py         # Pydantic request schemas
│   │   │   │   └── response.py        # Pydantic response schemas
│   │   │   └── services/
│   │   │       └── data_parser.py     # Dataset loader for chatbot context
│   │   └── forecasting/
│   │       ├── routes.py              # /api/v1/forecast/* endpoints
│   │       └── curated_plots.py       # Forecast chart helpers
│   ├── data/
│   │   ├── dashboard/                 # Warranty_Claims_Cleaned_MasterDataset.xlsx
│   │   ├── forecasting/               # Pre-computed forecast CSV outputs
│   │   └── chatbot/                   # Chatbot reference data
│   ├── requirements.txt
│   ├── .env                           # GEMINI_API_KEY, PORT
│   └── run.py                         # Uvicorn entry point
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root routes
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── Overview.jsx           # Overview dashboard page
│   │   │   ├── Complaints.jsx         # Complaints analysis page
│   │   │   ├── ZhcAnalysis.jsx        # Zero Hour Complaints page
│   │   │   ├── UsageAnalysis.jsx      # Usage analysis page
│   │   │   └── forecasting/
│   │   │       ├── ExecutiveSummary.jsx
│   │   │       ├── TrendsHistory.jsx
│   │   │       ├── ModelRiskWatch.jsx
│   │   │       ├── PartsInventory.jsx
│   │   │       └── CostOutlook.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.jsx        # Collapsible nav sidebar
│   │   │   ├── dashboard/             # KpiCard, ChartContainer, DashboardHeader
│   │   │   ├── chatbot/               # ChatWidget floating toggle
│   │   │   └── forecasting/
│   │   │       └── plotlyTheme.js     # Shared Plotly chart theme
│   │   ├── services/
│   │   │   ├── dashboardApi.js        # Dashboard API helpers
│   │   │   ├── chatbotApi.js          # Chatbot API helpers
│   │   │   └── forecastApi.js         # Forecasting API helpers
│   │   └── context/
│   │       └── FiscalYearContext.jsx  # Global FY filter via localStorage
│   ├── .env                           # VITE_API_URL
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Pages & Features

### Dashboard Pages

| Page | Route | Key Metrics |
|---|---|---|
| Overview | `/` | Total complaints, YoY trend, monthly/quarterly charts, model-stage breakdown |
| Complaints | `/complaints` | Top dealers/customers, application vs stage stacked chart, issue frequency |
| ZHC Analysis | `/zhc-analysis` | ZHC count, ZHC rate %, primary failure part, Pareto chart, ZHC by model |
| Usage Analysis | `/usage-analysis` | MTTF, avg age at failure, failure distribution histogram, RPM heatmap |

### Forecasting Pages (under `/forecasting/*`)

| Page | Route | Content |
|---|---|---|
| Executive Summary | `/forecasting/summary` | Monthly forecast line, key actions by priority |
| Trends & History | `/forecasting/trends` | Historical trend with ensemble forecast overlay |
| Model Risk Watch | `/forecasting/model-risk` | Expected claims by model, forecast reliability |
| Parts & Inventory | `/forecasting/parts` | Parts demand forecast, recommended stocking levels |
| Cost Outlook | `/forecasting/cost` | Warranty cost projections |

### Chatbot
- Floating widget (bottom-right corner), toggle to open/close
- Powered by Google Gemini via LangChain
- Answers natural-language queries about the warranty dataset
- Renders Plotly charts inline for visual answers

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `pandas` + `openpyxl` | Data processing |
| `numpy` | Numerical operations |
| `plotly` | Server-side chart data |
| `langchain` + `langchain-google-genai` | AI chatbot agent |
| `python-dotenv` | Environment variable management |
| `pydantic-settings` | Settings validation |

### Frontend
| Package | Purpose |
|---|---|
| `react` + `react-dom` 18 | UI framework |
| `react-router-dom` 7 | Client-side routing |
| `react-plotly.js` + `plotly.js` | Interactive charts |
| `tailwindcss` v4 | Utility-first CSS |
| `lucide-react` | Icon library |
| `react-markdown` + `remark-gfm` | Chatbot markdown rendering |
| `vite` 6 | Dev server and bundler |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env         # Add your GEMINI_API_KEY

python run.py
```

API available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`

> The Vite dev server proxies all `/api` requests to the backend automatically.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for the chatbot |
| `MODEL_NAME` | No | Gemini model name (default: `gemini-1.5-flash`) |
| `PORT` | No | Port to run on (default: `8000`) |

### Frontend — `frontend/.env`

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL for production builds | `http://localhost:8000` |

> During local development, the Vite proxy handles API routing — `VITE_API_URL` is only used in production builds.

---

## API Reference

All endpoints are prefixed with `/api/v1/`.

### Dashboard — `/api/v1/dashboard/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/fys` | List all available fiscal years |
| GET | `/overview?fy=FY25-26` | Overview page KPIs and chart data |
| GET | `/complaints?fy=FY25-26` | Complaints page KPIs and chart data |
| GET | `/zhc?fy=FY25-26` | ZHC analysis KPIs and chart data |
| GET | `/usage?fy=FY25-26` | Usage analysis KPIs and chart data |

### Chatbot — `/api/v1/chatbot/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat` | Send a message, receive AI response |

### Forecasting — `/api/v1/forecast/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/summary` | Executive summary — monthly complaints forecast |
| GET | `/trends` | Historical trends with forecast overlay |
| GET | `/model-risk` | Model-wise expected claims and risk |
| GET | `/parts` | Parts demand forecast |
| GET | `/cost` | Warranty cost outlook |

---

## Deployment

The application is designed as a single deployable unit on [Railway](https://railway.app).

### Build Steps

1. **Frontend build** — Run `npm run build` inside `frontend/`. The compiled assets go to `frontend/dist/`.
2. **Backend serves static files** — Configure FastAPI to mount `frontend/dist` as static files, or use a separate CDN.
3. **Single `run.py`** — Starts the unified FastAPI server on the `PORT` environment variable.

### Railway Configuration

- **Build command**: `pip install -r backend/requirements.txt`
- **Start command**: `python backend/run.py`
- **Environment variables**: Set `GEMINI_API_KEY` and `PORT` in Railway's variable settings.
