import os
import logging
from logging.handlers import RotatingFileHandler
import pathlib
import sys

# ログディレクトリの設定
LOG_DIR = os.getenv('LOG_DIR', 'logs')

# ロギングのフォーマット
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'

# ロガーの設定
def setup_logger():
    try:
        # ログディレクトリの作成（存在しない場合）
        pathlib.Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
        
        # ルートロガーの設定
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        
        # 既存のハンドラーをクリア（二重登録防止）
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # コンソールハンドラー
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(LOG_FORMAT, DATETIME_FORMAT)
        console_handler.setFormatter(console_formatter)
        root_logger.addHandler(console_handler)
        
        try:
            # ファイルハンドラー（ローテーション機能付き）
            file_handler = RotatingFileHandler(
                os.path.join(LOG_DIR, 'app.log'),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            )
            file_handler.setLevel(logging.INFO)
            file_formatter = logging.Formatter(LOG_FORMAT, DATETIME_FORMAT)
            file_handler.setFormatter(file_formatter)
            root_logger.addHandler(file_handler)
            
            # OpenAI用のロガー設定
            openai_logger = logging.getLogger('app.services.openai_service')
            openai_logger.setLevel(logging.INFO)
            
            # OpenAI専用のファイルハンドラー
            openai_file_handler = RotatingFileHandler(
                os.path.join(LOG_DIR, 'openai.log'),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            )
            openai_file_handler.setLevel(logging.INFO)
            openai_file_handler.setFormatter(file_formatter)
            openai_logger.addHandler(openai_file_handler)
        except (IOError, PermissionError) as e:
            # ファイルに書き込めない場合はコンソールにエラーを出力
            print(f"ログファイルの作成に失敗しました。コンソールログのみ有効: {str(e)}")
        
        return root_logger
        
    except Exception as e:
        # ロギング設定に失敗した場合はシンプルなロガーを返す
        print(f"ロガーの設定中にエラーが発生しました: {str(e)}")
        simple_logger = logging.getLogger()
        simple_logger.setLevel(logging.INFO)
        
        # 既存のハンドラーをクリア
        for handler in simple_logger.handlers[:]:
            simple_logger.removeHandler(handler)
            
        # シンプルなコンソールロガー
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        handler.setFormatter(logging.Formatter(LOG_FORMAT, DATETIME_FORMAT))
        simple_logger.addHandler(handler)
        
        return simple_logger 