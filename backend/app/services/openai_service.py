import json
from pathlib import Path
from typing import Dict, Any, List, Optional

from openai import OpenAI
from openai.types.chat import ChatCompletion

from app.core.config import OPENAI_API_KEY, OPENAI_INTERVIEW_QUESTIONS_MODEL, DEFAULT_INTERVIEW_PARAMS, InterviewMode

# OpenAIクライアントの初期化
client = OpenAI(api_key=OPENAI_API_KEY)

def load_prompt(prompt_path: Path) -> Dict[str, Any]:
    """プロンプトファイルを読み込む"""
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise Exception(f"プロンプトの読み込みに失敗しました: {e}")

def format_prompt_template(template: str, **kwargs) -> str:
    """テンプレートを値で置換する"""
    return template.format(**kwargs)

async def generate_interview_questions(
    prompt_path: Path,
    mode: InterviewMode,
    resume: Optional[str] = None,
    job_description: Optional[str] = None,
    params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    面接質問を生成する
    
    Args:
        prompt_path: プロンプトファイルのパス
        mode: 面接質問モード (general or personalize)
        resume: 応募者の経歴 (personalizeモードの場合)
        job_description: 応募求人情報 (personalizeモードの場合)
        params: OpenAI APIパラメータ（オプション）
        
    Returns:
        生成された面接質問
    """
    # プロンプトの読み込み
    prompt_data = load_prompt(prompt_path)
    
    # モードに応じたプロンプト設定を取得
    mode_config = prompt_data.get(mode, prompt_data.get("general"))
    system_prompt = mode_config["system"]
    user_template = mode_config["user_template"]
    
    # ユーザープロンプトのフォーマット
    template_args = {}
    
    # personalizeモードの場合、追加情報を設定
    if mode == InterviewMode.PERSONALIZE:
        if not resume or not job_description:
            raise ValueError("personalizeモードには経歴と応募求人情報が必要です")
        template_args["resume"] = resume
        template_args["job_description"] = job_description
    
    user_prompt = format_prompt_template(user_template, **template_args)
    
    # APIパラメータの設定
    api_params = DEFAULT_INTERVIEW_PARAMS.copy()
    if params:
        api_params.update(params)
    
    # ChatGPT APIの呼び出し
    response: ChatCompletion = client.chat.completions.create(
        model=OPENAI_INTERVIEW_QUESTIONS_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=api_params["temperature"],
        max_tokens=api_params["max_tokens"],
        top_p=api_params["top_p"],
        frequency_penalty=api_params["frequency_penalty"],
        presence_penalty=api_params["presence_penalty"],
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
                                       "Tell me about your experience and skills related to this position.")
            
        return response_data
    except json.JSONDecodeError:
        # JSON形式でない場合は辞書に変換してquestionフィールドを追加
        return {"question": content} 