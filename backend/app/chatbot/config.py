import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "KPCL AI Chatbot"
    VERSION: str = "1.0.0"

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-2.5-flash")

    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    BASE_DIR: str = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    ACTIVE_DATA_PATH: str = os.path.join(
        BASE_DIR, "data", "chatbot", "Warranty Claims Cleaned MasterDataset.xlsx"
    )
    KB_DATA_PATH: str = os.path.join(
        BASE_DIR, "data", "chatbot", "knowledge_base.xlsx"
    )
    COST_DATA_PATH: str = os.path.join(
        BASE_DIR, "data", "chatbot", "cost_Analysis_for_spare_part_cc.xlsx"
    )


settings = Settings()
