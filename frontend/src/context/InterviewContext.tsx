import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  isTextVisible?: boolean;
}

export interface FeedbackData {
  overallScore: number;
  englishScore: {
    pronunciation: number;
    vocabulary: number;
    grammar: number;
  };
  interviewScore: {
    structure: number;
    logic: number;
    softSkills: number;
  };
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  detailedFeedback: {
    questionId: string;
    question: string;
    answer: string;
    englishFeedback: string;
    interviewFeedback: string;
    idealAnswer: string;
  }[];
}

interface InterviewContextType {
  messages: Message[];
  isInterviewActive: boolean;
  feedback: FeedbackData | null;
  addMessage: (message: Omit<Message, 'id'>) => void;
  clearMessages: () => void;
  startInterview: () => void;
  endInterview: () => void;
  setFeedback: (data: FeedbackData) => void;
  toggleMessageVisibility: (id: string) => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [feedback, setFeedbackState] = useState<FeedbackData | null>(null);

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      isTextVisible: message.role === 'user', // User messages are always visible
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const startInterview = () => {
    clearMessages(); // Ensure messages are cleared first
    setIsInterviewActive(true);
    setFeedbackState(null);
  };

  const endInterview = () => {
    setIsInterviewActive(false);
    // clearMessages(); // 面接終了時にメッセージをクリアしない
  };

  const setFeedback = (data: FeedbackData) => {
    setFeedbackState(data);
  };

  const toggleMessageVisibility = (id: string) => {
    setMessages(prev => prev.map(message => 
      message.id === id 
        ? { ...message, isTextVisible: !message.isTextVisible }
        : message
    ));
  };

  return (
    <InterviewContext.Provider
      value={{
        messages,
        isInterviewActive,
        feedback,
        addMessage,
        clearMessages,
        startInterview,
        endInterview,
        setFeedback,
        toggleMessageVisibility,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};