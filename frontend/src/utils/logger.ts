// ブラウザ環境用のシンプルなロガー実装
import { getOrCreateUserId } from './uuid';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const logToFile = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const userId = getOrCreateUserId();
  const logEntry = {
    timestamp,
    userId,
    message,
    data
  };

  // 開発環境でのデバッグ用にコンソールに出力
  console.log('Log Entry:', logEntry);

  // バックエンドAPIへも送信
  axios.post(`${API_BASE_URL}/api/logs`, logEntry)
    .catch(err => {
      console.warn('ログAPI送信エラー', err);
    });
};