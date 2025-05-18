import axios from 'axios';
import { logToFile } from '../utils/logger';
import { feedbackConfig } from '../config/interview';

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

// 音声合成リクエストの型定義
interface TextToSpeechRequest {
  text: string;
  voice?: string;
}

// 音声認識レスポンスの型定義
interface SpeechToTextResponse {
  transcript: string;
  error?: string;
}

// 面接評価レスポンスの型定義
interface EvaluationResponse {
  englishSkill: {
    overall: number;
    vocabulary: number;
    grammar: number;
  };
  interviewSkill: {
    overall: number;
    logicalStructure: number;
    dataSupport: number;
  };
  summary: {
    strengths: string;
    improvements: string;
    actions: string;
  };
}

// 詳細フィードバックのQA項目
interface FeedbackQA {
  question: string;
  answer: string;
}

// 詳細フィードバックの評価結果
interface FeedbackEvaluation {
  englishFeedback: string;
  interviewFeedback: string;
  idealAnswer: string;
}

// 詳細フィードバックレスポンスの型定義
interface DetailedFeedbackResponse {
  feedbacks: (FeedbackEvaluation | null)[];
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

  // テキストから音声を生成
  async generateSpeech(text: string, voice: string = 'alloy'): Promise<Blob> {
    try {
      logToFile('Generating speech from text', { textLength: text.length, voice });
      
      const response = await axios.post(
        `${API_BASE_URL}/api/interview/text-to-speech`,
        { text, voice },
        { responseType: 'blob' } // 重要: レスポンスをBlobとして受け取る
      );
      
      logToFile('Speech generation successful', { 
        contentType: response.headers['content-type'],
        contentLength: response.data.size 
      });
      
      return response.data;
    } catch (error) {
      logToFile('Error generating speech', { error });
      throw error;
    }
  },

  // 音声を認識しテキストに変換
  async recognizeSpeech(audioBlob: Blob, language: string = 'en-US'): Promise<string> {
    try {
      logToFile('Recognizing speech from audio', { 
        blobSize: audioBlob.size, 
        blobType: audioBlob.type,
        language
      });
      
      // FormDataの作成
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);
      
      const response = await axios.post<SpeechToTextResponse>(
        `${API_BASE_URL}/api/interview/speech-to-text`,
        audioBlob,
        { 
          headers: {
            'Content-Type': audioBlob.type,
            'Accept': 'application/json'
          },
          params: {
            language // クエリパラメータで言語指定
          }
        }
      );
      
      logToFile('Speech recognition successful', { 
        transcriptLength: response.data.transcript?.length || 0 
      });
      
      return response.data.transcript || '';
    } catch (error) {
      logToFile('Error recognizing speech', { error });
      // エラー時は空文字列を返す（繰り返しリトライするため）
      return '';
    }
  },

  // 面接の評価を取得
  async evaluateInterview(messageHistory: Message[], language: string = "en"): Promise<EvaluationResponse> {
    try {
      logToFile('Requesting interview evaluation', { messageHistoryLength: messageHistory.length, language });
      
      const response = await axios.post<EvaluationResponse>(
        `${API_BASE_URL}/api/interview/evaluation`,
        { 
          message_history: messageHistory,
          language
        }
      );
      
      logToFile('Evaluation received successfully');
      return response.data;
    } catch (error) {
      logToFile('Error evaluating interview', { error });
      throw error;
    }
  },

  // 詳細なQAフィードバックを取得
  async getDetailedFeedback(qaList: FeedbackQA[], maxFeedbackCount: number = feedbackConfig.freeDetailedFeedbackCount, language: string = "en"): Promise<DetailedFeedbackResponse> {
    try {
      logToFile('Requesting detailed feedback', { 
        qaCount: qaList.length, 
        maxFeedbackCount,
        language 
      });
      
      const response = await axios.post<DetailedFeedbackResponse>(
        `${API_BASE_URL}/api/interview/detailed-feedback`,
        { 
          qa_list: qaList,
          max_feedback_count: maxFeedbackCount,
          language
        }
      );
      
      logToFile('Detailed feedback received successfully');
      return response.data;
    } catch (error) {
      logToFile('Error getting detailed feedback', { error });
      throw error;
    }
  },
};

export default api; 