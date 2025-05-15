from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import Response
from typing import Dict, List, Any
from pydantic import BaseModel

from app.schemas.interview import InterviewQuestionRequest, InterviewQuestionResponse, MessageHistory, TextToSpeechRequest, InterviewEvaluationRequest, InterviewEvaluationResponse, DetailedFeedbackRequest, DetailedFeedbackResponse, FeedbackQA, FeedbackEvaluation
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

@router.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """テキストから音声を生成する"""
    try:
        logger.info(f"音声合成リクエスト: text長={len(request.text)}文字, voice={request.voice}")
        
        # OpenAI APIを使用して音声を生成
        audio_data = await openai_service.text_to_speech(
            text=request.text,
            voice=request.voice
        )
        
        # 音声データを返す
        logger.info(f"音声合成完了: サイズ={len(audio_data)}バイト")
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        logger.error(f"音声合成エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluation", response_model=InterviewEvaluationResponse)
async def evaluate_interview(request: InterviewEvaluationRequest):
    """面接の対話履歴を評価する"""
    try:
        logger.info(f"面接評価リクエスト: message_history={len(request.message_history)}件, language={request.language}")
        
        # OpenAI APIを使用して評価を生成
        evaluation = await openai_service.evaluate_interview(
            request.message_history,
            language=request.language
        )
        logger.info(f"生成された評価: {evaluation}")
        
        return evaluation
    except Exception as e:
        logger.error(f"面接評価エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detailed-feedback", response_model=DetailedFeedbackResponse)
async def get_detailed_feedback(request: DetailedFeedbackRequest):
    """面接のQAペアごとに詳細なフィードバックを生成する"""
    try:
        logger.info(f"詳細フィードバックリクエスト: qa_count={len(request.qa_list)}件, max_feedback_count={request.max_feedback_count}, language={request.language}")
        
        # QAリストを辞書形式に変換
        qa_dict_list = [{"question": qa.question, "answer": qa.answer} for qa in request.qa_list]
        
        # OpenAI APIを使用して詳細フィードバックを生成
        feedbacks = await openai_service.generate_detailed_feedback(
            qa_dict_list,
            max_feedback_count=request.max_feedback_count,
            language=request.language
        )
        
        logger.info(f"生成された詳細フィードバック数: {sum(1 for f in feedbacks if f is not None)}/{len(feedbacks)}")
        
        return DetailedFeedbackResponse(feedbacks=feedbacks)
    except Exception as e:
        logger.error(f"詳細フィードバック生成エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))