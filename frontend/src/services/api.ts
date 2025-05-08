import axios from 'axios';
import { logToFile } from '../utils/logger';

// APIのベースURL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axiosインスタンスの作成
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスの型定義
interface ApiResponse<T> {
  data: T;
}

// 質問生成レスポンスの型定義
interface QuestionResponse {
  question: string;
}

// メッセージの型定義
interface Message {
  role: string;
  content: string;
}

// インタビュー関連のAPI
export const interviewApi = {
  // 一般的な質問を生成
  async generateGeneralQuestion(messageHistory: Message[] = []): Promise<QuestionResponse> {
    try {
      const response = await axios.post<QuestionResponse>(
        `${API_BASE_URL}/api/interview/questions/general`,
        { message_history: messageHistory }
      );
      return response.data;
    } catch (error) {
      logToFile('Error generating general question', { error });
      throw error;
    }
  },

  // パーソナライズされた質問を生成
  async generatePersonalizedQuestion(
    resume: string,
    jobDescription: string,
    messageHistory: Message[] = []
  ): Promise<QuestionResponse> {
    try {
      const response = await axios.post<QuestionResponse>(
        `${API_BASE_URL}/api/interview/questions/personalized`,
        {
          resume,
          job_description: jobDescription,
          message_history: messageHistory,
        }
      );
      return response.data;
    } catch (error) {
      logToFile('Error generating personalized question', { error });
      throw error;
    }
  },
};

export default api; 