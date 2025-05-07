from fastapi import APIRouter

router = APIRouter(prefix="/api/interview", tags=["interview"])

@router.get("/")
async def get_interview_info():
    return {"message": "面接情報API"}