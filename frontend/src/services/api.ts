import axios from 'axios';

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
interface InterviewQuestionResponse {
  question: string;
  // APIのレスポンスに他のフィールドがある場合はここに追加
}

// インタビュー関連のAPI
export const interviewApi = {
  // 一般的な質問を生成する
  generateGeneralQuestion: async (): Promise<InterviewQuestionResponse> => {
    try {
      const response = await api.post<InterviewQuestionResponse>('/api/interview/generate-questions', {
        mode: 'general'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating general question:', error);
      throw error;
    }
  },

  // パーソナライズされた質問を生成する
  generatePersonalizedQuestion: async (resume: string, jobDescription: string): Promise<InterviewQuestionResponse> => {
    try {
      const response = await api.post<InterviewQuestionResponse>('/api/interview/generate-questions', {
        mode: 'personalize',
        resume,
        job_description: jobDescription
      });
      return response.data;
    } catch (error) {
      console.error('Error generating personalized question:', error);
      throw error;
    }
  }
};

export default api; 