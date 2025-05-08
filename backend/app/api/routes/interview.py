from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, List, Any
from pydantic import BaseModel

from app.schemas.interview import InterviewQuestionRequest, InterviewQuestionResponse, MessageHistory
from app.services.openai_service import OpenAIService
from app.core.logger import setup_logger
from app.core.config import InterviewMode

router = APIRouter(prefix="/api/interview", tags=["interview"])
openai_service = OpenAIService()
logger = setup_logger()

# リクエストのためのスキーマ
class GeneralQuestionRequest(BaseModel):
    message_history: List[Dict[str, str]] = []

@router.get("/")
async def get_interview_info():
    return {"message": "面接情報API"}

@router.post("/questions/general", response_model=InterviewQuestionResponse)
async def generate_general_question(request: GeneralQuestionRequest = Body(...)):
    """汎用的な面接質問を生成する"""
    try:
        logger.info(f"汎用質問生成リクエスト: message_history={len(request.message_history)}件")
        
        # リクエストのデータ構造をInterviewQuestionRequestに変換
        interview_request = InterviewQuestionRequest(
            mode=InterviewMode.GENERAL, 
            message_history=request.message_history
        )
        
        # 質問生成
        question = await openai_service.generate_interview_question(interview_request)
        logger.info(f"生成された質問: {question}")
        
        return {"question": question}
    except Exception as e:
        logger.error(f"質問生成エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/questions/personalized", response_model=InterviewQuestionResponse)
async def generate_personalized_question(
    resume: str = Body(...), 
    job_description: str = Body(...),
    message_history: List[Dict[str, Any]] = Body(default=[])
):
    """個人化された面接質問を生成する"""
    try:
        logger.info(f"個人化質問生成リクエスト: message_history={len(message_history)}件")
        
        request = InterviewQuestionRequest(
            mode=InterviewMode.PERSONALIZED,
            resume=resume,
            job_description=job_description,
            message_history=message_history
        )
        
        question = await openai_service.generate_interview_question(request)
        logger.info(f"生成された質問: {question}")
        
        return {"question": question}
    except Exception as e:
        logger.error(f"質問生成エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))