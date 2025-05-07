import os
from pathlib import Path
from dotenv import load_dotenv
from enum import Enum

# .envファイルを読み込む
load_dotenv()

# 面接質問モード
class InterviewMode(str, Enum):
    GENERAL = "general"
    PERSONALIZE = "personalize"

# OpenAI API設定
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# プロンプト設定ディレクトリ
PROMPTS_DIR = os.getenv("PROMPTS_DIR", "app/core/prompts")

# プロンプトパス
INTERVIEW_QUESTIONS_PROMPT_PATH = Path(PROMPTS_DIR) / "interview_questions.json"

# モデル設定
OPENAI_INTERVIEW_QUESTIONS_MODEL = "gpt-4o-mini"

# 面接質問生成のデフォルトパラメータ
DEFAULT_INTERVIEW_PARAMS = {
    "temperature": 0.7,
    "max_tokens": 500,
    "top_p": 0.9,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
} 