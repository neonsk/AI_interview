from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.config import InterviewMode


class MessageHistory(BaseModel):
    """対話メッセージ"""
    role: str = Field(..., description="メッセージの役割（'user'または'assistant'）")
    content: str = Field(..., description="メッセージの内容")


class InterviewQuestionRequest(BaseModel):
    """面接質問生成リクエスト - モードに応じた形式"""
    mode: InterviewMode = Field(InterviewMode.GENERAL, description="面接質問モード")
    resume: Optional[str] = Field(None, description="応募者の経歴 (personalizeモードの場合必須)")
    job_description: Optional[str] = Field(None, description="応募求人情報 (personalizeモードの場合必須)")
    message_history: Optional[List[MessageHistory]] = Field(default=[], description="これまでの対話履歴")
    custom_params: Optional[Dict[str, Any]] = Field(None, description="カスタムパラメータ（オプション）")


class InterviewQuestionResponse(BaseModel):
    """面接質問生成レスポンス"""
    question: str = Field(..., description="生成された面接質問") 