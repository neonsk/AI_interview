import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logToFile } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { Mic, X, Square, Send, Keyboard, Play, Pause, Eye, EyeOff, XCircle } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import CompletionDialog from '../components/CompletionDialog';
import InterviewTimer from '../components/InterviewTimer';
import AudioRecorder from '../components/AudioRecorder';
import { interviewConfig } from '../config/interview';
import { getMockFeedback } from '../utils/mockData';
import { interviewApi } from '../services/api';

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { messages, addMessage, startInterview, endInterview, setFeedback, toggleMessageVisibility } = useInterview();
  const [isAIQuestionReady, setIsAIQuestionReady] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(interviewConfig.duration);
  const [showSpeakAgain, setShowSpeakAgain] = useState(false);
  const [playingUserAudio, setPlayingUserAudio] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    
    setShouldAutoScroll(isAtBottom);
    setIsUserScrolling(false);
  };

  const handleScrollStart = () => {
    setIsUserScrolling(true);
  };

  const generateQuestion = async (): Promise<string> => {
    try {
      const interviewMode = sessionStorage.getItem('interviewMode') || 'general';
      let response;
      
      // 対話履歴をAPI用のフォーマットに変換
      const messageHistoryForApi = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // ログ出力（デバッグ用）
      logToFile('Sending message history to API', { 
        messageCount: messageHistoryForApi.length,
        messages: messageHistoryForApi
      });
      
      if (interviewMode === 'personalized') {
        const resume = sessionStorage.getItem('resume') || '';
        const jobDescription = sessionStorage.getItem('jobDescription') || '';
        
        if (resume && jobDescription) {
          response = await interviewApi.generatePersonalizedQuestion(resume, jobDescription, messageHistoryForApi);
        } else {
          response = await interviewApi.generateGeneralQuestion(messageHistoryForApi);
        }
      } else {
        response = await interviewApi.generateGeneralQuestion(messageHistoryForApi);
      }
      
      return response.question;
    } catch (error) {
      logToFile('Error generating question', { error });
      throw error;
    }
  };

  // ユーザーが最後に追加したメッセージを含む、最新のメッセージリストを作成
  const createUpdatedMessageList = (userMessage: { content: string, audioUrl?: string }): any[] => {
    return [...messages, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage.content,
      audioUrl: userMessage.audioUrl,
      isTextVisible: true
    }];
  };

  // APIリクエスト用のメッセージ履歴を生成
  const generateQuestionWithMessages = async (messagesForApi: any[]): Promise<string> => {
    try {
      const interviewMode = sessionStorage.getItem('interviewMode') || 'general';
      let response;
      
      // 対話履歴をAPI用のフォーマットに変換
      const messageHistoryForApi = messagesForApi.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // ログ出力（デバッグ用）
      logToFile('Generating question with explicit messages', { 
        messageCount: messageHistoryForApi.length,
        lastMessage: messageHistoryForApi[messageHistoryForApi.length - 1]
      });
      
      if (interviewMode === 'personalized') {
        const resume = sessionStorage.getItem('resume') || '';
        const jobDescription = sessionStorage.getItem('jobDescription') || '';
        
        if (resume && jobDescription) {
          response = await interviewApi.generatePersonalizedQuestion(resume, jobDescription, messageHistoryForApi);
        } else {
          response = await interviewApi.generateGeneralQuestion(messageHistoryForApi);
        }
      } else {
        response = await interviewApi.generateGeneralQuestion(messageHistoryForApi);
      }
      
      return response.question;
    } catch (error) {
      logToFile('Error generating question', { error });
      throw error;
    }
  };

  // 質問を生成して表示する統合関数
  const displayNextQuestion = async (
    messagesForApi: any[] | undefined = undefined,
    isFirstQuestion: boolean = false, 
    fallbackMessage: string = "Let me ask you another question about your experience."
  ): Promise<boolean> => {
    setIsLoading(true);
    scrollToBottom();
    setIsAudioLoading(true);
    
    try {
      let aiMessage: string;
      
      if (isFirstQuestion) {
        aiMessage = "Hello. Let's start the interview. At first, please introduce yourself.";
      } else if (messagesForApi) {
        // 明示的に指定されたメッセージリストを使用（ユーザーの最新メッセージが含まれる）
        aiMessage = await generateQuestionWithMessages(messagesForApi);
      } else {
        // 現在のmessages状態を使用（初回質問や最新メッセージが不要なとき）
        aiMessage = await generateQuestion();
      }
      
      addMessage({
        role: 'assistant',
        content: aiMessage,
        isTextVisible: true,
      });
      
      scrollToBottom();
      playAIMessage(aiMessage);
      setIsLoading(false);
      return true;
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: fallbackMessage,
        isTextVisible: true,
      });
      
      scrollToBottom();
      playAIMessage(fallbackMessage);
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    let isComponentMounted = true; // コンポーネントのマウント状態を追跡
    
    // 面接の初期化処理
    const initializeInterview = async () => {
      // まず面接状態をリセットして開始
      endInterview();
      startInterview();
      
      // マイク許可を試みる
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // 許可された場合はそのまま音声モードで続行
      } catch (err) {
        if (!isComponentMounted) return;
        // マイク許可が得られなかった場合はキーボードモードに切り替え
        logToFile('Microphone access denied', { error: err });
        setIsKeyboardMode(true);
        // ただし面接自体は中断しない
      }
      
      if (!isComponentMounted) return;
      
      // マイクの許可状況に関わらず、少し遅延してから最初の質問を表示
      setTimeout(() => {
        if (!isComponentMounted) return;
        
        // 最初の質問を表示
        displayNextQuestion(undefined, true)
          .then(() => {
            if (!isComponentMounted) return;
            setIsAIQuestionReady(true);
          });
      }, 1000);
    };
    
    // 初期化を実行
    initializeInterview();
    
    // クリーンアップ関数
    return () => {
      isComponentMounted = false; // アンマウント時にフラグを更新
      
      // 必要なクリーンアップ処理
      endInterview();
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // 空の依存配列で一度だけ実行

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setShowEndDialog(true);
    }
  }, [timeRemaining]);

  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isLoading, transcription, isRecording]);

  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleEndInterview = () => {
    const mockFeedback = getMockFeedback(messages);
    setFeedback(mockFeedback);
    navigate('/feedback');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscription('');
    setShouldAutoScroll(true);
    audioRecorderRef.current?.querySelector('button')?.click();
  };

  const handleStopRecording = (audioBlob?: Blob, audioUrl?: string, transcript?: string) => {
    setIsRecording(false);
    
    logToFile('handleStopRecording called', {
      transcript,
      transcriptionState: transcription,
      hasAudioBlob: !!audioBlob,
      hasAudioUrl: !!audioUrl
    });
    
    const finalTranscription = (transcript ?? '').trim();
    
    if (!finalTranscription && !audioUrl) {
      setShowSpeakAgain(true);
      setTimeout(() => setShowSpeakAgain(false), 2000);
      return;
    }
    
    // 音声入力の結果をUIに表示せずに直接APIに送信
    processUserInput(finalTranscription, audioUrl);
  };

  // ユーザー入力を処理して次の質問を表示する共通関数
  const processUserInput = async (text: string, audioUrl?: string) => {
    const trimmedText = text.trim();
    
    logToFile('Processing user input', {
      text: trimmedText,
      hasAudioUrl: !!audioUrl
    });
    
    if (!trimmedText) return;
    
    // UIを更新するためにメッセージを追加
    addMessage({
      role: 'user',
      content: trimmedText,
      audioUrl,
      isTextVisible: true,
    });
    
    // メッセージ履歴にユーザーの入力を明示的に追加してAPIに送信
    const updatedMessages = createUpdatedMessageList({ 
      content: trimmedText, 
      audioUrl 
    });
    
    await displayNextQuestion(updatedMessages, false, "Sorry, I didn't catch that. Please try again.");
  };

  const handleTranscriptionUpdate = (text: string) => {
    console.log('Transcription update received', { text });
    setTranscription(text);
  };

  const handleCancel = () => {
    setIsRecording(false);
    setTranscription('');
    setShouldAutoScroll(true);
    setShowSpeakAgain(false);
    
    // キャンセルボタンをクリック
    const cancelButton = audioRecorderRef.current?.querySelector('button:nth-child(2)') as HTMLButtonElement | null;
    if (cancelButton) {
      cancelButton.click(); // キャンセル用のボタンをクリック
    } else {
      // キャンセルボタンが見つからない場合は通常のストップボタンをクリック
      const stopButton = audioRecorderRef.current?.querySelector('button') as HTMLButtonElement | null;
      if (stopButton) {
        stopButton.click();
      }
      logToFile('Cancel button not found, using normal stop button');
    }
  };

  const toggleKeyboardMode = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setShouldAutoScroll(true);
    setIsKeyboardMode(!isKeyboardMode);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleTextInputSubmit = async () => {
    const trimmedText = textInput.trim();
    if (!trimmedText) return;
    
    logToFile('Text input submitted', { trimmedText });
    setShouldAutoScroll(true);
    
    // 入力をクリア
    setTextInput('');
    
    // 共通処理を呼び出し
    await processUserInput(trimmedText);
  };

  const playAIMessage = async (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = interviewConfig.synthesis.language;
      utterance.onend = () => setIsAudioLoading(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      logToFile('Error playing TTS', { error });
      setIsAudioLoading(false);
    }
  };

  const playAudio = (messageId: string, content: string) => {
    if ('speechSynthesis' in window) {
      if (isPlaying === messageId) {
        window.speechSynthesis.cancel();
        setIsPlaying(null);
      } else {
        if (isPlaying) {
          window.speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => setIsPlaying(null);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(messageId);
      }
    }
  };

  const handleUserAudioPlayback = (messageId: string, audioUrl?: string) => {
    if (!audioUrl) return;
    
    if (playingUserAudio === messageId) {
      const audioElements = document.getElementsByTagName('audio');
      for (let audio of audioElements) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingUserAudio(null);
    } else {
      if (playingUserAudio) {
        const audioElements = document.getElementsByTagName('audio');
        for (let audio of audioElements) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingUserAudio(null);
      audio.play();
      setPlayingUserAudio(messageId);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 relative">
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <div className="flex-1" />
        <InterviewTimer timeRemaining={timeRemaining} />
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            {t('common.endInterview')}
          </button>
        </div>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 pb-32 scrollbar-visible mb-24"
        onScroll={handleScroll}
        onTouchStart={handleScrollStart}
        onMouseDown={handleScrollStart}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9'
        }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'bg-blue-600 text-white flex flex-col gap-2'
                }`}
                style={{ opacity: message.role === 'assistant' && isAudioLoading ? 0.7 : 1 }}
              >
                {message.role === 'assistant' ? (
                  <div className="space-y-2 min-h-[2.5rem]">
                    <div className="relative min-h-[1.25rem]">
                      <p className={`${message.isTextVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                        {message.content}
                      </p>
                      {!message.isTextVisible && (
                        <div 
                          className="bg-gray-200 rounded absolute inset-0"
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => playAudio(message.id, message.content)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={isPlaying === message.id ? "Pause audio" : "Play audio"}
                      >
                        {isPlaying === message.id ? (
                          <Pause size={16} className="text-gray-600" />
                        ) : (
                          <Play size={16} className="text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleMessageVisibility(message.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={message.isTextVisible ? "Hide text" : "Show text"}
                      >
                        {message.isTextVisible ? (
                          <EyeOff size={16} className="text-gray-600" />
                        ) : (
                          <Eye size={16} className="text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.audioUrl && (
                      <div className="flex items-center gap-2 mt-1 text-blue-100">
                        <button
                          onClick={() => handleUserAudioPlayback(message.id, message.audioUrl)}
                          className="p-1 hover:bg-blue-500 rounded-full transition-colors"
                          aria-label={playingUserAudio === message.id ? "Stop playback" : "Play recording"}
                        >
                          {playingUserAudio === message.id ? (
                            <Pause size={14} />
                          ) : (
                            <Play size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-lg shadow-sm max-w-[85%]">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="flex justify-end">
              <div className="bg-blue-100 p-4 rounded-lg shadow-sm max-w-[85%]">
                <div className="mb-2 flex items-center">
                  <span className="text-sm text-blue-800 flex items-center">
                    <span className="mr-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                    {t('common.recording')}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {transcription || '...'}
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div ref={audioRecorderRef} className="hidden">
        <AudioRecorder
          onTranscriptionUpdate={handleTranscriptionUpdate}
          onRecordingStop={handleStopRecording}
        />
      </div>

      {isKeyboardMode ? (
        <div className="fixed inset-x-0 bottom-0 bg-gray-50 py-6">
          <div className="max-w-2xl mx-auto px-4 flex space-x-2">
            <textarea
              className="flex-1 resize-none p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('common.typeAnswer')}
              rows={3}
              value={textInput}
              onChange={handleTextInputChange}
            ></textarea>
            <div className="flex flex-col space-y-2">
              <Button
                variant="primary"
                onClick={handleTextInputSubmit}
                leftIcon={<Send size={18} />}
                disabled={isLoading}
                className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 animate-pulse-subtle overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:animate-shine"
                style={{
                  animation: isLoading ? 'none' : 'pulse-subtle 2s infinite'
                }}
              >
                {t('common.send')}
              </Button>
              <Button
                variant="outline"
                onClick={toggleKeyboardMode}
                leftIcon={<Mic size={18} />}
              >
                {t('common.voice')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 bg-gray-50 py-6">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-center gap-8">
              {isRecording ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    aria-label="Cancel recording"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  <button
                    onClick={() => audioRecorderRef.current?.querySelector('button')?.click()}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-all transform hover:scale-105"
                    aria-label="Stop recording"
                  >
                    <Square className="w-6 h-6 md:w-8 md:h-8" />
                  </button>

                  <button
                    onClick={toggleKeyboardMode}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label={t('common.keyboard')}
                  >
                    <Keyboard className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </>
              ) : (
                <>
                  {showSpeakAgain && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
                      {t('common.speakAgain')}
                    </div>
                  )}
                  <div className="w-10 h-10 md:w-12 md:h-12" />
                  <button
                    onClick={handleStartRecording}
                    disabled={isLoading || !isAIQuestionReady}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isLoading || !isAIQuestionReady 
                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    aria-label="Start recording"
                  >
                    <Mic className="w-8 h-8 md:w-10 md:h-10" />
                  </button>

                  <button
                    onClick={toggleKeyboardMode}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label={t('common.keyboard')}
                  >
                    <Keyboard className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={() => {
            setShowConfirmDialog(false);
            setShowEndDialog(true);
          }}
        />
      )}

      {showEndDialog && (
        <CompletionDialog
          isOpen={showEndDialog}
          onViewFeedback={handleEndInterview}
        />
      )}
    </div>
  );
};

export default InterviewPage;