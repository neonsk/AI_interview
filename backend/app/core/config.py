import os
import json
from enum import Enum
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv

# .envファイルを読み込む
load_dotenv()

# 面接質問モード
class InterviewMode(str, Enum):
    """面接質問モード"""
    GENERAL = "general"           # 一般的な面接質問
    PERSONALIZED = "personalized" # 経歴・求人情報に基づく質問

# プロンプトファイルパス
PROMPTS_DIR = os.getenv("PROMPTS_DIR", "app/core/prompts")
INTERVIEW_QUESTIONS_PROMPT_PATH = Path(PROMPTS_DIR) / "interview_questions.json"

# OpenAI APIパラメータ
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_INTERVIEW_QUESTIONS_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_TEMPERATURE = 0.7

# デフォルトの質問生成パラメータ
DEFAULT_INTERVIEW_PARAMS = {
    "max_tokens": 300,
    "temperature": OPENAI_TEMPERATURE,
    "top_p": 1,
    "frequency_penalty": 0.5,
    "presence_penalty": 0.5
}

class Settings(BaseSettings):
    """アプリケーション設定"""
    # アプリケーション情報
    APP_NAME: str = "AI面接システム"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = Field(default=True)
    
    # OpenAI API設定
    OPENAI_API_KEY: str = Field(default=OPENAI_API_KEY)
    OPENAI_MODEL: str = Field(default=OPENAI_INTERVIEW_QUESTIONS_MODEL)
    OPENAI_TEMPERATURE: float = Field(default=OPENAI_TEMPERATURE)
    
    # ファイルパス設定
    PROMPTS_DIR: str = Field(default=PROMPTS_DIR)
    INTERVIEW_QUESTIONS_PROMPT_PATH: Path = Field(default=INTERVIEW_QUESTIONS_PROMPT_PATH)
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

# 設定インスタンスを作成
settings = Settings() 