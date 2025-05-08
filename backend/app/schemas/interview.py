from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.config import InterviewMode


class MessageHistory(BaseModel):
    """対話メッセージ"""
    role: str = Field(..., description="メッセージの送信者（'system', 'user', 'assistant'）")
    content: str = Field(..., description="メッセージの内容")


class InterviewQuestionRequest(BaseModel):
    """面接質問生成リクエスト - モードに応じた形式"""
    mode: InterviewMode = Field(default=InterviewMode.GENERAL, description="面接モード")
    resume: Optional[str] = Field(default=None, description="応募者の履歴書（personalizedモードのみ）")
    job_description: Optional[str] = Field(default=None, description="求人情報（personalizedモードのみ）")
    message_history: List[Dict[str, Any]] = Field(default=[], description="これまでの対話履歴")
    custom_params: Optional[Dict[str, Any]] = Field(None, description="カスタムパラメータ（オプション）")


class InterviewQuestionResponse(BaseModel):
    """面接質問生成レスポンス"""
    question: str = Field(..., description="生成された面接質問")


# 音声合成リクエスト用のスキーマ
class TextToSpeechRequest(BaseModel):
    text: str = Field(..., description="音声に変換するテキスト")
    voice: Optional[str] = Field(default="alloy", description="使用する音声タイプ") 