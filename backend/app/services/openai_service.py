import os
import json
import aiofiles
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import io

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion

from app.core.config import settings, InterviewMode
from app.schemas.interview import InterviewQuestionRequest

# ロガーの設定
logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        """OpenAI APIサービスの初期化"""
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.temperature = settings.OPENAI_TEMPERATURE
    
    async def _load_prompt_json(self, path: str) -> Dict[str, Any]:
        """プロンプトJSONファイルを読み込む"""
        try:
            async with aiofiles.open(path, mode='r', encoding='utf-8') as f:
                content = await f.read()
                return json.loads(content)
        except Exception as e:
            raise ValueError(f"プロンプトJSONの読み込みに失敗しました: {str(e)}")
    
    def _format_prompt_template(self, template: str, **kwargs) -> str:
        """テンプレートを値で置換する"""
        return template.format(**kwargs)
    
    async def generate_interview_question(self, request: InterviewQuestionRequest) -> str:
        """面接質問を生成する"""
        try:
            # プロンプトJSONの読み込み
            prompt_path = settings.INTERVIEW_QUESTIONS_PROMPT_PATH
            prompt_data = await self._load_prompt_json(prompt_path)
            
            # モードに応じたプロンプト設定を取得
            mode_key = request.mode.value
            mode_config = prompt_data.get(mode_key, prompt_data.get("general"))
            
            system_prompt = mode_config["system"]
            
            # personalizedモードの場合、追加情報を設定
            if request.mode == InterviewMode.PERSONALIZED:
                if not request.resume or not request.job_description:
                    raise ValueError("personalizedモードには履歴書と求人情報が必要です")
                
                # 経歴と求人情報をシステムプロンプトに追加
                system_prompt += f"\n\n応募者の経歴:\n{request.resume}\n\n"
                system_prompt += f"求人情報:\n{request.job_description}\n\n"
            
            # 対話履歴の有無に基づいて指示を追加
            if request.message_history and len(request.message_history) > 0:
                system_prompt += "これまでの質問と回答を考慮して、次の質問を考えてください。同じ質問を繰り返さないようにしてください。またJSON形式で回答してください。"
            else:
                system_prompt += "質問はJSON形式で返してください。"
            
            # メッセージ履歴を構築
            messages = [{"role": "system", "content": system_prompt}]
            
            # 対話履歴がある場合は追加
            if request.message_history and len(request.message_history) > 0:
                # 対話履歴を追加
                for msg in request.message_history:
                    # Dictの場合は直接roleとcontentを取得
                    if isinstance(msg, dict):
                        role = msg.get("role", "")
                        content = msg.get("content", "")
                    # MessageHistoryオブジェクトの場合は属性からアクセス
                    else:
                        role = msg.role
                        content = msg.content
                        
                    messages.append({
                        "role": role,
                        "content": content
                    })
            
            # リクエスト前にモデルとメッセージの内容をログ出力
            logger.info(f"OpenAI API リクエスト - モード: {request.mode.value}")
            logger.info(f"使用モデル: {self.model}")
            logger.info(f"メッセージ数: {len(messages)}")
            logger.info(f"対話履歴数: {len(request.message_history) if request.message_history else 0}")
            logger.info(f"メッセージ内容: {json.dumps(messages, ensure_ascii=False, indent=2)}")
            
            # OpenAI APIを呼び出して質問を生成
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=300,
                response_format={"type": "json_object"}
            )
            
            # レスポンスの処理
            content = response.choices[0].message.content
            
            try:
                response_data = json.loads(content)
                
                # interview_questionフィールドがあれば、questionフィールドに変換
                if 'interview_question' in response_data:
                    response_data['question'] = response_data.pop('interview_question')
                    
                # スキーマに合わせて必要なフィールドが存在するか確認
                if 'question' not in response_data:
                    # questionフィールドがなければ追加（フォールバック）
                    response_data['question'] = response_data.get('raw_response', 
                                              "あなたの経験やスキルについて教えてください。")
                    
                return response_data['question']
            except json.JSONDecodeError:
                # JSON形式でない場合はそのまま返す
                return content
                
        except Exception as e:
            raise Exception(f"質問生成中にエラーが発生しました: {str(e)}")
    
    async def text_to_speech(self, text: str, voice: str = None) -> bytes:
        """テキストを音声に変換する
        
        Args:
            text: 音声に変換するテキスト
            voice: 使用する音声タイプ (alloy, echo, fable, onyx, nova, shimmer)
            
        Returns:
            bytes: 音声データのバイナリ
        """
        try:
            # 指定された音声タイプが利用可能かチェック
            selected_voice = voice if voice in settings.OPENAI_TTS_AVAILABLE_VOICES else settings.OPENAI_TTS_VOICE
            
            logger.info(f"音声合成リクエスト - テキスト長: {len(text)}, 音声: {selected_voice}")
            
            response = await self.client.audio.speech.create(
                model=settings.OPENAI_TTS_MODEL,
                voice=selected_voice,
                input=text,
                response_format=settings.OPENAI_TTS_RESPONSE_FORMAT
            )
            
            # レスポンスからバイナリデータを取得
            audio_data = io.BytesIO()
            for chunk in response.iter_bytes(chunk_size=4096):
                audio_data.write(chunk)
            audio_data.seek(0)
            
            # バイナリデータを返す
            logger.info(f"音声合成成功 - 出力サイズ: {audio_data.getbuffer().nbytes} bytes")
            return audio_data.getvalue()
            
        except Exception as e:
            logger.error(f"音声合成中にエラーが発生しました: {str(e)}")
            raise Exception(f"音声合成エラー: {str(e)}") 