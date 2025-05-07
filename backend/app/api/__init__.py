from fastapi import APIRouter
from app.api.routes import interview

api_router = APIRouter()
api_router.include_router(interview.router)