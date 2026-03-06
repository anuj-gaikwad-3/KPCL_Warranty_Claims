import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(title="KPCL Warranty Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.dashboard.routes import router as dashboard_router
from app.chatbot.routes import router as chatbot_router
from app.forecasting.routes import router as forecast_router

app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["Chatbot"])
app.include_router(forecast_router, prefix="/api/v1/forecast", tags=["Forecasting"])


@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "KPCL Warranty Intelligence Platform",
        "services": {
            "dashboard": "/api/v1/dashboard",
            "chatbot": "/api/v1/chatbot",
            "forecasting": "/api/v1/forecast",
        },
    }


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
