import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logToFile } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { Mic, X, Square, Send, Keyboard, Play, Pause, Eye, EyeOff } from 'lucide-react';
import { useInterview, FeedbackData, Message } from '../context/InterviewContext';
import { useAudioStopper } from '../context/AudioStopperContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import CompletionDialog from '../components/CompletionDialog';
import InterviewTimer from '../components/InterviewTimer';
import AudioRecorder, { AudioRecorderHandle } from '../components/AudioRecorder';
import { interviewConfig } from '../config/interview';
import { interviewApi } from '../services/api';
import { createAudioWithVolume } from '../utils/audio';

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { messages, addMessage, startInterview, endInterview, setFeedback, toggleMessageVisibility } = useInterview();
  const { registerAudio, unregisterAudio } = useAudioStopper();
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
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAnyAudioPlaying, setIsAnyAudioPlaying] = useState(false);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{id: string, blob: Blob | null, text: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
        
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 10);
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

  // 共通の音声再生関数
  const playAudioBlob = (
    audioBlob: Blob | null,
    messageId: string,
    text: string
  ) => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = createAudioWithVolume(audioUrl);
      const audioId = registerAudio(audio);
      audio.onended = () => {
        setIsAudioLoading(false);
        setIsAnyAudioPlaying(false);
        setIsPlaying(null);
        unregisterAudio(audioId);
        scrollToBottom();
      };
      audio.onerror = (error) => {
        logToFile('Error playing generated audio', { error });
        setIsAudioLoading(false);
        setIsAnyAudioPlaying(false);
        setIsPlaying(null);
        unregisterAudio(audioId);
      };
      setAudioElements(prev => ({ ...prev, [messageId]: audio }));
      updatePlayingState(true, messageId);
      audio.play();
    } else {
      // フォールバック: ブラウザの音声合成API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = interviewConfig.synthesis.language;
      utterance.onend = () => {
        setIsAudioLoading(false);
        setIsAnyAudioPlaying(false);
        setIsPlaying(null);
      };
      window.speechSynthesis.speak(utterance);
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
        aiMessage = await generateQuestionWithMessages(messagesForApi);
      } else {
        aiMessage = await generateQuestion();
      }

      let audioBlob: Blob | null = null;
      try {
        audioBlob = await interviewApi.generateSpeech(aiMessage);
      } catch (e) {
        logToFile('Error generating speech (pre-addMessage)', { error: e });
        // フォールバックはplayAudioBlob内で対応
      }

      const msgId: string = addMessage({
        role: 'assistant',
        content: aiMessage,
        isTextVisible: true,
        id: isFirstQuestion ? Date.now().toString() : undefined,
      } as Omit<Message, 'id'> & { id?: string });
      setTimeout(() => {
        scrollToBottom();
      }, 50);
      scrollToBottom();
      setIsLoading(false);
      setPendingAudio({ id: msgId, blob: audioBlob, text: aiMessage });
      return true;
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: fallbackMessage,
        isTextVisible: true,
      } as Omit<Message, 'id'> & { id?: string });
      setTimeout(() => {
        scrollToBottom();
      }, 50);
      scrollToBottom();
      setIsLoading(false);
      return false;
    }
  };

  // メッセージが追加されたときに音声を生成
  useEffect(() => {
    if (pendingAudio) {
      playAudioBlob(pendingAudio.blob, pendingAudio.id, pendingAudio.text);
      setPendingAudio(null);
    }
  }, [messages, pendingAudio]);

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
      // マイク許可が得られなかった場合はキーボードモードに切り替え
      logToFile('Microphone access denied', { error: err });
      setIsKeyboardMode(true);
      // ただし面接自体は中断しない
    }
    
    // マイクの許可状況に関わらず、少し遅延してから最初の質問を表示
    setTimeout(() => {
      // 最初の質問を表示
      displayNextQuestion(undefined, true)
        .then(() => {
          setIsAIQuestionReady(true);
        });
    }, 1000);
  };

  // useEffectでisAudioAllowedがtrueになったタイミングで初期化
  useEffect(() => {
    if (isAudioAllowed) {
      initializeInterview();
    }
    // isAudioAllowedがfalse→trueになった時だけ初期化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioAllowed]);

  // 面接時間のカウントダウン
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

  // 重複したuseEffectを1つに統合
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isLoading, transcription, isRecording, isPlaying, isAnyAudioPlaying, audioElements]);

  const handleEndInterview = () => {
    // モックデータを使わず、実際のデータ構造でフィードバックを初期化
    const initialFeedback: FeedbackData = {
      overallScore: 0,
      englishScore: {
        pronunciation: 0,
        vocabulary: 0,
        grammar: 0
      },
      interviewScore: {
        structure: 0,
        logic: 0,
        softSkills: 0
      },
      strengths: [],
      improvements: [],
      nextSteps: [],
      // メッセージ履歴からQ&Aのペアを抽出（空のフィードバックで初期化）
      detailedFeedback: messages.reduce((acc: any[], message, index) => {
        if (message.role === 'assistant') {
          const userResponse = messages[index + 1];
          if (userResponse && userResponse.role === 'user') {
            acc.push({
              questionId: message.id,
              question: message.content,
              answer: userResponse.content,
              englishFeedback: '',  // APIから取得するため空にしておく
              interviewFeedback: '',  // APIから取得するため空にしておく
              idealAnswer: ''  // APIから取得するため空にしておく
            });
          }
        }
        return acc;
      }, []),
      // 評価中フラグを明示的に設定
      isEvaluating: false, // 評価取得処理が開始されていない状態
      isLoadingDetailedFeedback: false, // 詳細フィードバック取得処理が開始されていない状態
      evaluation: undefined // 明示的にundefinedを設定し、評価結果がないことを示す
    };
    
    // 空のフィードバックを先にセットしてから画面遷移
    setFeedback(initialFeedback);
    navigate('/feedback');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscription('');
    setShouldAutoScroll(true);
    audioRecorderRef.current?.startRecording();
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
    
    // メッセージ追加後に強制的にスクロール
    setTimeout(() => {
      scrollToBottom();
    }, 50);
    
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
    audioRecorderRef.current?.cancelRecording();
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

  // 音声再生状態を更新する関数
  const updatePlayingState = (playing: boolean, messageId: string | null = null) => {
    // 音声の再生状態を更新（true: 再生中、false: 停止中）
    setIsAnyAudioPlaying(playing);
    
    // 再生中のメッセージIDを更新（null: どのメッセージも再生していない）
    setIsPlaying(messageId);
    
    // 音声再生が停止したらスクロールを最下部に移動
    if (!playing && messageId === null) {
      // 少し遅延させてDOMが更新された後にスクロール
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
    
    // ログ出力
    if (playing && messageId) {
      logToFile('Audio playback started', { messageId });
    } else {
      logToFile('Audio playback stopped');
    }
  };

  const playAudio = async (messageId: string, content: string) => {
    // 再生中の音声があれば停止
    if (isPlaying === messageId) {
      if (audioElements[messageId]) {
        audioElements[messageId].pause();
        audioElements[messageId].currentTime = 0;
        updatePlayingState(false, null);
      }
      return;
    }
    
    // 録音中または何らかの音声が再生中の場合は処理をキャンセル
    if (isAnyAudioPlaying || isRecording) {
      logToFile('Cannot play audio: already playing or recording', { isAnyAudioPlaying, isRecording });
      return;
    }
    
    // 他の再生中の音声があれば停止
    if (isPlaying && audioElements[isPlaying]) {
      audioElements[isPlaying].pause();
      audioElements[isPlaying].currentTime = 0;
    }
    
    try {
      // すでに生成済みの音声があるか確認
      if (audioElements[messageId]) {
        // 既存の音声を再生
        updatePlayingState(true, messageId);
        
        // 再生完了時のイベントリスナーを設定
        const audio = audioElements[messageId];
        
        // 再生前に既存のイベントリスナーをクリア
        const newAudio = createAudioWithVolume(audio.src);
        
        // AudioStopperContextに登録
        const audioId = registerAudio(newAudio);
        
        // 再生完了時のイベントリスナーを設定
        newAudio.onended = () => {
          updatePlayingState(false, null);
          unregisterAudio(audioId);
        };
        
        newAudio.onerror = (error) => {
          logToFile('Error playing cached audio', { error, messageId });
          updatePlayingState(false, null);
          unregisterAudio(audioId);
        };
        
        // 再生
        newAudio.play().catch(error => {
          logToFile('Error playing audio', { error, messageId });
          updatePlayingState(false, null);
          unregisterAudio(audioId);
        });
        
        // 新しい音声要素で置き換え
        setAudioElements(prev => ({
          ...prev,
          [messageId]: newAudio
        }));
        
        return;
      }
      
      // 音声を生成
      updatePlayingState(true, messageId);
      const audioBlob = await interviewApi.generateSpeech(content);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 音声エレメントを作成
      const audio = createAudioWithVolume(audioUrl);
      
      // AudioStopperContextに登録
      const audioId = registerAudio(audio);
      
      // イベントハンドラーを設定
      audio.onended = () => {
        updatePlayingState(false, null);
        unregisterAudio(audioId);
      };
      
      audio.onerror = (error) => {
        logToFile('Error playing generated audio', { error, messageId });
        updatePlayingState(false, null);
        unregisterAudio(audioId);
      };
      
      // 状態を更新
      setAudioElements(prev => ({
        ...prev,
        [messageId]: audio
      }));
      
      // 再生
      audio.play();
    } catch (error) {
      logToFile('Error generating or playing audio', { error, messageId });
      updatePlayingState(false, null);
      
      // フォールバック: ブラウザの音声合成APIを使用
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => {
          updatePlayingState(false, null);
        };
        updatePlayingState(true, messageId);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  useEffect(() => {
    logToFile('page_view', { page: 'InterviewPage' });
  }, []);

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
        className="flex-1 overflow-y-auto px-4 py-6 pb-24 scrollbar-visible mb-28"
        onScroll={handleScroll}
        onTouchStart={handleScrollStart}
        onMouseDown={handleScrollStart}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9'
        }}
      >
        <div className="max-w-2xl mx-auto space-y-6 mb-4">
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
                        className={`p-1 ${isPlaying === message.id ? 'bg-gray-200' : 'hover:bg-gray-100'} rounded-full transition-colors ${
                          (isAnyAudioPlaying && isPlaying !== message.id) || isRecording ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        aria-label={isPlaying === message.id ? "停止" : "再生"}
                        disabled={(isAnyAudioPlaying && isPlaying !== message.id) || isRecording}
                      >
                        {isPlaying === message.id ? (
                          <Pause size={16} className="text-gray-600" />
                        ) : (
                          <Play size={16} className={`text-gray-600 ${isAnyAudioPlaying || isRecording ? 'opacity-50' : ''}`} />
                        )}
                      </button>
                      <button
                        onClick={() => toggleMessageVisibility(message.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={message.isTextVisible ? "テキストを隠す" : "テキストを表示"}
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
                    {isSpeaking ? t('common.recording') : t('common.waiting')}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {transcription || '...'}
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      <div className="hidden">
        <AudioRecorder
          ref={audioRecorderRef}
          onTranscriptionUpdate={handleTranscriptionUpdate}
          onRecordingStop={handleStopRecording}
          onSpeakingStatusChange={setIsSpeaking}
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
                disabled={isLoading || isAnyAudioPlaying}
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
                disabled={isAnyAudioPlaying}
                leftIcon={<Mic size={18} />}
                className={isAnyAudioPlaying ? 'opacity-50 cursor-not-allowed' : ''}
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
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center ${isAnyAudioPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'} transition-colors`}
                    aria-label="Cancel recording"
                    disabled={isAnyAudioPlaying}
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  <button
                    onClick={() => audioRecorderRef.current?.stopRecording()}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-600 ${isAnyAudioPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'} flex items-center justify-center transition-all transform ${isAnyAudioPlaying ? '' : 'hover:scale-105'}`}
                    aria-label="Stop recording"
                    disabled={isAnyAudioPlaying}
                  >
                    <Square className="w-6 h-6 md:w-8 md:h-8" />
                  </button>

                  <button
                    onClick={toggleKeyboardMode}
                    disabled={isAnyAudioPlaying}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center ${
                      isAnyAudioPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                    } transition-colors`}
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
                    disabled={isLoading || !isAIQuestionReady || isAnyAudioPlaying}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isLoading || !isAIQuestionReady || isAnyAudioPlaying
                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    aria-label="Start recording"
                  >
                    <Mic className="w-8 h-8 md:w-10 md:h-10" />
                  </button>

                  <button
                    onClick={toggleKeyboardMode}
                    disabled={isAnyAudioPlaying}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center ${
                      isAnyAudioPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                    } transition-colors`}
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

      {/* 音声再生許可モーダル */}
      {!isAudioAllowed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900">{t('audio.permissionTitle')}</h2>
            <p className="text-gray-700 mb-6 text-center">{t('audio.permissionMessage')}</p>
            <Button
              variant="primary"
              size="large"
              onClick={() => setIsAudioAllowed(true)}
              className="w-full"
            >
              {t('audio.startWithAudio')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;