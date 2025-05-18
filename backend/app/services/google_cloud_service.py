import os
import logging
import io
from google.cloud import speech_v1 as speech
from google.api_core.exceptions import GoogleAPIError
from typing import Optional

from app.core.config import settings

# ロガーの設定
logger = logging.getLogger(__name__)

class GoogleCloudService:
    """Google Cloudのサービスを扱うクラス"""
    
    def __init__(self):
        """Google Cloud Speech-to-Text APIクライアントの初期化"""
        # 環境変数から認証情報を読み取り（GOOGLE_APPLICATION_CREDENTIALS）
        self.speech_client = speech.SpeechClient()
    
    async def speech_to_text(self, audio_content: bytes, language_code: str = "en-US") -> tuple[str, Optional[str]]:
        """音声データをテキストに変換する
        
        Args:
            audio_content: 音声データのバイナリ
            language_code: 音声の言語コード（デフォルト: en-US）
            
        Returns:
            tuple: (認識テキスト, エラーメッセージ)
        """
        try:
            logger.info(f"音声認識リクエスト - データサイズ: {len(audio_content)}バイト, 言語: {language_code}")
            
            # 音声データの設定
            audio = speech.RecognitionAudio(content=audio_content)
            
            # 認識設定
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,  # 必要に応じて調整
                language_code=language_code,
                enable_automatic_punctuation=True,
            )
            
            # 音声認識の実行
            response = self.speech_client.recognize(config=config, audio=audio)
            
            # 結果の処理
            transcript = ""
            for result in response.results:
                transcript += result.alternatives[0].transcript + " "
            
            transcript = transcript.strip()
            logger.info(f"音声認識成功 - テキスト長: {len(transcript)}文字")
            
            return transcript, None
            
        except GoogleAPIError as e:
            error_msg = f"Google Speech-to-Text APIエラー: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return "", error_msg
            
        except Exception as e:
            error_msg = f"音声認識中に予期せぬエラーが発生しました: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return "", error_msg 