from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router

app = FastAPI(title="AI Interview API")

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に設定すること
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターの統合
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "AI Interview API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}