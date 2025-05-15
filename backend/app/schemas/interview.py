from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.config import InterviewMode, settings


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


# 面接評価リクエスト用のスキーマ
class InterviewEvaluationRequest(BaseModel):
    """面接評価リクエスト"""
    message_history: List[Dict[str, Any]] = Field(..., description="面接の対話履歴")
    language: str = Field(default="en", description="言語設定（en/ja）")


# 面接評価レスポンス用のスキーマ
class InterviewEvaluationResponse(BaseModel):
    """面接評価レスポンス"""
    englishSkill: Dict[str, float] = Field(
        ..., 
        description="英語力評価（総合・語彙力・文法）",
        example={
            "overall": 4.5,
            "vocabulary": 4.0,
            "grammar": 4.5
        }
    )
    interviewSkill: Dict[str, float] = Field(
        ..., 
        description="面接対応力評価（総合・論理構成・数値）",
        example={
            "overall": 3.5,
            "logicalStructure": 4.0,
            "dataSupport": 3.0
        }
    )
    summary: Dict[str, str] = Field(
        ..., 
        description="総合評価（強み・改善点・アクション）",
        example={
            "strengths": "論理的な説明ができており、具体例を適切に使用しています。",
            "improvements": "専門用語の使い方に若干の誤りがあります。",
            "actions": "業界固有の専門用語をより正確に使えるように学習しましょう。"
        }
    ) 


# 詳細フィードバックのQA項目
class FeedbackQA(BaseModel):
    """QAセット"""
    question: str = Field(..., description="面接質問")
    answer: str = Field(..., description="ユーザーの回答")


# 詳細フィードバックリクエスト
class DetailedFeedbackRequest(BaseModel):
    """詳細フィードバックリクエスト"""
    qa_list: List[FeedbackQA] = Field(..., description="質問と回答のリスト")
    max_feedback_count: int = Field(default=settings.FREE_DETAILED_FEEDBACK_COUNT, description="フィードバックを生成する最大QA数")
    language: str = Field(default="en", description="言語設定（en/ja）")


# 詳細フィードバックの評価結果
class FeedbackEvaluation(BaseModel):
    """各QAの評価結果"""
    englishFeedback: str = Field(..., description="英語力の評価フィードバック")
    interviewFeedback: str = Field(..., description="面接対応力の評価フィードバック")
    idealAnswer: str = Field(..., description="理想的な回答例")


# 詳細フィードバックレスポンス
class DetailedFeedbackResponse(BaseModel):
    """詳細フィードバックレスポンス"""
    feedbacks: List[Optional[FeedbackEvaluation]] = Field(..., description="各QAの評価結果、未評価の場合はNull") 