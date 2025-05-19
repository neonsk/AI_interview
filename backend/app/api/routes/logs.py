from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import os
import json
from datetime import datetime

LOG_DIR = 'logs'
LOG_FILE = os.path.join(LOG_DIR, 'access.log')


router = APIRouter(prefix="/api/logs", tags=["logs"])

class LogEntry(BaseModel):
    userId: str = Field(...)
    timestamp: str = Field(...)
    message: str = Field(...)
    data: dict | None = None

@router.post('', status_code=201)
async def post_log(entry: LogEntry, request: Request):
    try:
        # ディレクトリ・ファイルがなければ作成
        os.makedirs(LOG_DIR, exist_ok=True)
        if not os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'w', encoding='utf-8') as f:
                pass
        # 1行1JSONで追記
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry.dict(), ensure_ascii=False) + '\n')
        return {"status": "ok"}
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": str(e)})
