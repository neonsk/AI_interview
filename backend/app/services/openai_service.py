import os
import json
import aiofiles
import logging
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
import io
from jinja2 import Template

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
    
    async def _load_prompt(self, path: str) -> Dict[str, Any]:
        """プロンプトファイル（JSONまたはYAML）を読み込む"""
        try:
            # Pathオブジェクトを文字列に変換
            path_str = str(path)
            
            async with aiofiles.open(path, mode='r', encoding='utf-8') as f:
                content = await f.read()
                
                # ファイル拡張子で処理を分ける
                if path_str.endswith('.json'):
                    return json.loads(content)
                elif path_str.endswith('.yaml') or path_str.endswith('.yml'):
                    return yaml.safe_load(content)
                else:
                    raise ValueError(f"サポートされていないファイル形式です: {path}")
        except Exception as e:
            raise ValueError(f"プロンプトファイルの読み込みに失敗しました: {str(e)}")
    
    # def _format_prompt_template(self, template: str, **kwargs) -> str:
    #     """テンプレートを値で置換する"""
    #     return template.format(**kwargs)
    
    async def generate_interview_question(self, request: InterviewQuestionRequest) -> str:
        """面接質問を生成する"""
        try:
            # プロンプトファイルの読み込み
            prompt_path = settings.INTERVIEW_QUESTIONS_PROMPT_PATH
            prompt_data = await self._load_prompt(prompt_path)
            
            # 統合プロンプトを取得
            prompt_config = prompt_data.get("interview_question")
            if not prompt_config:
                raise ValueError("interview_questionプロンプトが見つかりません")

            # Jinja2テンプレートとして埋め込み
            system_template = Template(prompt_config["system"])
            system_prompt = system_template.render(
                resume=request.resume or '',
                job_description=request.job_description or ''
            )

            # メッセージ履歴を構築
            messages = [{"role": "system", "content": system_prompt}]
            
            # 対話履歴がある場合は追加
            if request.message_history and len(request.message_history) > 0:
                for msg in request.message_history:
                    if isinstance(msg, dict):
                        role = msg.get("role", "")
                        content = msg.get("content", "")
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
                max_tokens=50,
                response_format={"type": "json_object"}
            )
            
            # レスポンスの処理
            content = response.choices[0].message.content
            logger.info(f"OpenAI API レスポンス: {content}")
            
            try:
                response_data = json.loads(content)
                
                # interview_questionフィールドがあれば、questionフィールドに変換
                if 'interview_question' in response_data:
                    response_data['question'] = response_data.pop('interview_question')
                    
                # スキーマに合わせて必要なフィールドが存在するか確認
                if 'question' not in response_data:
                    # questionフィールドがなければ追加（フォールバック）
                    response_data['question'] = response_data.get('raw_response', 
                                              "Sorry, please try again.")
                    
                if 'reaction' in response_data:
                    return_data = response_data['reaction']+' '+response_data['question']
                else:
                    return_data = response_data['question']
                return return_data
            
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
            logger.error(f"音声合成中にエラーが発生しました: {str(e)}", exc_info=True)
            raise Exception(f"音声合成エラー: {str(e)}")
    
    async def evaluate_interview(self, message_history: List[Dict[str, Any]], language: str = "en") -> Dict[str, Any]:
        """面接の対話履歴を評価する
        
        Args:
            message_history: 面接の対話履歴
            language: 言語設定（en/ja）
            
        Returns:
            Dict[str, Any]: 評価結果
        """
        try:
            # プロンプトファイルの読み込み
            prompt_path = settings.INTERVIEW_QUESTIONS_PROMPT_PATH
            prompt_data = await self._load_prompt(prompt_path)
            
            # 評価用のプロンプト設定を取得
            evaluation_config = prompt_data.get("evaluation", {})
            
            # 言語に応じたプロンプト選択
            if language.lower() == "ja":
                system_prompt = evaluation_config.get("system_ja", "")
            else:
                system_prompt = evaluation_config.get("system_en", "")
            
            # プロンプトが空の場合はエラー
            if not system_prompt:
                raise ValueError(f"評価用のシステムプロンプトが設定されていません（言語: {language}）")
            
            # メッセージ履歴を構築
            messages = [{"role": "system", "content": system_prompt}]
            
            # 対話履歴を追加
            if language.lower() == "ja":
                user_prompt = evaluation_config.get("user_prompt_ja", "以下の面接対話履歴を評価してください。必ず指定されたJSONフォーマットでレスポンスを返してください。")
                user_prompt += "\n\n対話履歴:\n"
            else:
                user_prompt = evaluation_config.get("user_prompt_en", "Please evaluate the following interview conversation. Make sure to respond using the specified JSON format.")
                user_prompt += "\n\nConversation history:\n"
            
            # 対話履歴をフォーマット
            formatted_history = []
            for i, msg in enumerate(message_history):
                role = msg.get("role", "")
                content = msg.get("content", "")
                if language.lower() == "ja":
                    role_name = "面接官" if role == "assistant" else "応募者"
                else:
                    role_name = "Interviewer" if role == "assistant" else "Candidate"
                formatted_history.append(f"{i+1}. {role_name}: {content}")
            
            user_prompt += "\n".join(formatted_history)
            messages.append({"role": "user", "content": user_prompt})
            
            # リクエスト前にモデルとメッセージの内容をログ出力
            logger.info(f"面接評価リクエスト（言語: {language}）")
            logger.info(f"使用モデル: {self.model}")
            logger.info(f"メッセージ数: {len(messages)}")
            logger.info(f"メッセージ内容: {json.dumps(messages, ensure_ascii=False, indent=2)}")
            
            # OpenAI APIを呼び出して評価を生成
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,  # 評価なので低めの温度設定
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # レスポンスの処理
            content = response.choices[0].message.content
            
            try:
                # JSONパース
                evaluation = json.loads(content)
                
                # 必要なフィールドが存在するか確認
                required_fields = ["englishSkill", "interviewSkill", "summary"]
                for field in required_fields:
                    if field not in evaluation:
                        raise ValueError(f"評価結果に{field}フィールドがありません")
                
                # 各サブフィールドも確認
                if not all(key in evaluation["englishSkill"] for key in ["overall", "vocabulary", "grammar"]):
                    raise ValueError("englishSkillに必要なフィールドがありません")
                
                if not all(key in evaluation["interviewSkill"] for key in ["overall", "logicalStructure", "dataSupport"]):
                    raise ValueError("interviewSkillに必要なフィールドがありません")
                
                if not all(key in evaluation["summary"] for key in ["strengths", "improvements", "actions"]):
                    raise ValueError("summaryに必要なフィールドがありません")
                
                # 言語情報を追加
                evaluation["language"] = language
                
                # サマリー部分のログ出力（改行の確認用）
                logger.info(
                    f"評価結果（サマリー）:\n" +
                    f"strengths=\n{evaluation['summary']['strengths']}\n" +
                    f"improvements=\n{evaluation['summary']['improvements']}\n" + 
                    f"actions=\n{evaluation['summary']['actions']}"
                )
                
                return evaluation
                
            except json.JSONDecodeError as e:
                logger.error(f"評価結果のJSONパースに失敗しました: {str(e)}")
                logger.error(f"OpenAIレスポンス全文: {content}")
                raise ValueError(f"評価結果のJSONパースに失敗しました: {str(e)}")
                
        except Exception as e:
            logger.error(f"面接評価中にエラーが発生しました: {str(e)}", exc_info=True)
            raise Exception(f"面接評価エラー: {str(e)}")

    async def generate_detailed_feedback(
        self, qa_list: List[Dict[str, str]], max_feedback_count: int = 1, language: str = "en"
    ) -> List[Optional[Dict[str, str]]]:
        """
        面接のQ&Aごとに詳細なフィードバックを生成する
        
        Args:
            qa_list: 質問と回答のリスト
            max_feedback_count: フィードバックを生成する最大QA数
            language: 言語設定（en/ja）
            
        Returns:
            各QAの評価結果のリスト（英語力フィードバック、面接対応力フィードバック、理想的な回答）
        """
        try:
            # QAリストの範囲チェック
            if not qa_list:
                logger.error("QAリストが空です")
                return []
                
            # 評価結果を格納するリスト
            results = []
            
            # プロンプトファイルの読み込み
            prompt_path = settings.INTERVIEW_QUESTIONS_PROMPT_PATH
            prompt_data = await self._load_prompt(prompt_path)
            
            # 詳細フィードバック用のプロンプト設定を取得
            detailed_feedback_config = prompt_data.get("detailed_feedback", {})
            
            # 言語に応じたシステムプロンプト選択
            if language.lower() == "ja":
                system_prompt = detailed_feedback_config.get("system_ja", "")
                user_prompt_template = detailed_feedback_config.get("user_prompt_ja", "")
            else:
                system_prompt = detailed_feedback_config.get("system_en", "")
                user_prompt_template = detailed_feedback_config.get("user_prompt_en", "")
            
            # プロンプトが空の場合はエラー
            if not system_prompt:
                raise ValueError(f"詳細フィードバック用のシステムプロンプトが設定されていません（言語: {language}）")
            
            # 各QAペアを評価
            logger.info(f"詳細フィードバック生成リクエスト（言語: {language}, QA数: {len(qa_list)}）")
            for i, qa in enumerate(qa_list):
                # 最大フィードバック数を超えた場合はNoneを追加
                if i >= max_feedback_count:
                    results.append(None)
                    continue
                    
                question = qa.get("question", "")
                answer = qa.get("answer", "")
                
                # 質問または回答が空の場合はスキップ
                if not question or not answer:
                    logger.warning(f"質問または回答が空です: index={i}")
                    results.append(None)
                    continue
                
                # ユーザープロンプトの作成
                user_prompt = user_prompt_template.format(
                    question=question,
                    answer=answer
                )
                
                # APIリクエストの準備
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                
                # リクエスト前にログ出力
                logger.info(f"詳細フィードバック生成リクエスト（言語: {language}, QA index: {i}）")
                logger.info(f"メッセージ内容: {json.dumps(messages, ensure_ascii=False, indent=2)}") 
                # OpenAI APIを呼び出してフィードバックを生成
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=300,
                    response_format={"type": "json_object"}
                )
                
                # レスポンスの処理
                content = response.choices[0].message.content
                logger.info(f"OpenAIレスポンス全文: {content}")
                
                try:
                    # JSONパース
                    feedback = json.loads(content)
                    logger.info(f"QA: {qa}")
                    logger.info(f"フィードバック結果: {feedback}")
                    
                    # 必要なフィールドが存在するか確認
                    required_fields = ["englishFeedback", "interviewFeedback", "idealAnswer"]
                    for field in required_fields:
                        if field not in feedback:
                            raise ValueError(f"フィードバック結果に{field}フィールドがありません")
                    
                    # 結果を追加
                    results.append(feedback)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"フィードバック結果のJSONパースに失敗しました: {str(e)}")
                    results.append(None)
            
            return results
                
        except Exception as e:
            logger.error(f"詳細フィードバック生成中にエラーが発生しました: {str(e)}", exc_info=True)
            raise Exception(f"詳細フィードバックエラー: {str(e)}") 