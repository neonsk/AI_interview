from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.core.config import INTERVIEW_QUESTIONS_PROMPT_PATH, InterviewMode
from app.schemas.interview import InterviewQuestionRequest, InterviewQuestionResponse
from app.services.openai_service import generate_interview_questions

router = APIRouter(prefix="/api/interview", tags=["interview"])

@router.get("/")
async def get_interview_info():
    return {"message": "面接情報API"}

@router.post("/generate-questions", response_model=InterviewQuestionResponse)
async def generate_questions(request: InterviewQuestionRequest) -> Dict[str, Any]:
    """
    面接質問を生成するエンドポイント
    
    Args:
        request: 面接質問生成リクエスト
        
    Returns:
        生成された面接質問
    """
    try:
        # 基本パラメータ
        common_params = {
            "prompt_path": INTERVIEW_QUESTIONS_PROMPT_PATH,
            "mode": request.mode,
            "params": request.custom_params
        }
        
        # モードに応じた追加パラメータ
        if request.mode == InterviewMode.PERSONALIZE:
            if not request.resume or not request.job_description:
                raise HTTPException(status_code=400, detail="personalizeモードには経歴と応募求人情報が必要です")
            
            common_params["resume"] = request.resume
            common_params["job_description"] = request.job_description
        
        # OpenAI APIを呼び出して質問を生成
        questions = await generate_interview_questions(**common_params)
        
        return questions
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"質問生成中にエラーが発生しました: {str(e)}")