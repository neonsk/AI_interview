import logging
import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

# APIルータのインポート
try:
    from app.api.routes import interview
    from app.core.logger import setup_logger
    from app.api.routes import logs
    
    # ロガーの初期化（try内で例外を捕捉できるようにする）
    logger = setup_logger()
except Exception as e:
    print(f"アプリケーションの初期化中にエラーが発生しました: {str(e)}")
    logger = logging.getLogger()

app = FastAPI(
    title="AI面接システム",
    description="AI面接を行うためのAPIサービス",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では特定のオリジンに制限すること
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターの統合
try:
    # 直接ルーターを追加（interview.py内のprefixが既に/api/interviewなので、追加のprefixは不要）
    app.include_router(interview.router)
    app.include_router(logs.router)
except Exception as e:
    print(f"APIルーターの統合中にエラーが発生しました: {str(e)}")

@app.get("/")
async def root():
    try:
        logger.info("ルートエンドポイントにアクセスがありました")
    except Exception:
        pass
    return {"message": "AI面接システムAPIへようこそ"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}