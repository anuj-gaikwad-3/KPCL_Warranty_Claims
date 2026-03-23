import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Indi4 Warranty Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        #"https://kpcl-warranty-claims-frontend.onrender.com",
    ],
    allow_origin_regex=r"^https:\/\/.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.forecasting.routes import router as forecast_router

# Forecasting API should always be available.
app.include_router(forecast_router, prefix="/api/v1/forecast", tags=["Forecasting"])
# Legacy alias for the KPCLwarrantyClaims static frontend (expects /api/*).
app.include_router(forecast_router, prefix="/api", tags=["ForecastingLegacy"])

# Dashboard + Chatbot can have heavier/optional dependencies.
try:
    from app.dashboard.routes import router as dashboard_router

    app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["Dashboard"])
except Exception as e:
    logger.warning("Dashboard router not loaded: %s", e)

try:
    from app.chatbot.routes import router as chatbot_router

    app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["Chatbot"])
except Exception as e:
    logger.warning("Chatbot router not loaded: %s", e)

# Serve the standalone forecasting frontend (static bundle) directly from backend.
# This is intentionally scoped to forecasting only and does not affect dashboard/chatbot UI.
FORECAST_UI_DIR = Path(__file__).parent / "forecasting_webapp" / "static"
if FORECAST_UI_DIR.exists():
    app.mount("/forecasting", StaticFiles(directory=str(FORECAST_UI_DIR), html=True), name="forecasting-ui")


@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Indi4 Warranty Intelligence Platform",
        "services": {
            "dashboard": "/api/v1/dashboard",
            "chatbot": "/api/v1/chatbot",
            "forecasting": "/api/v1/forecast",
            "forecasting_ui": "/forecasting",
        },
    }


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
