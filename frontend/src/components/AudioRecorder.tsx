import React, { useEffect, useRef, useState } from 'react';
import { logToFile } from '../utils/logger';
import { interviewConfig } from '../config/interview';

// Web Speech API用の型定義
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface Window {
  SpeechRecognition?: {
    new(): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new(): SpeechRecognition;
  };
}

interface AudioRecorderProps {
  onTranscriptionUpdate: (text: string) => void;
  onRecordingStop: (audioBlob?: Blob, audioUrl?: string, transcript?: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onTranscriptionUpdate, 
  onRecordingStop 
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const isCanceledRef = useRef<boolean>(false);

  useEffect(() => {
    // Set up initial media stream
    setupMediaStream();

    // Clean up on component unmount
    return () => {
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err) {
      logToFile('Error accessing microphone', { error: err });
    }
  };

  const setupRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // @ts-ignore TypeScriptのエラーを無視する - 実行時にはAPI使用可能
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      recognition.continuous = interviewConfig.speech.continuous;
      recognition.interimResults = interviewConfig.speech.interimResults;
      recognition.lang = interviewConfig.speech.language;
      
      // @ts-ignore TypeScriptのエラーを無視する
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;
        
        logToFile('Speech recognition result event', {
          resultLength: event.results.length,
          resultIndex: event.resultIndex
        });

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += ' ' + transcript;
            finalTranscriptRef.current = finalTranscript;
            logToFile('Final transcript updated', { finalTranscript });
          } else {
            interimTranscript += transcript;
            interimTranscriptRef.current = interimTranscript;
            logToFile('Interim transcript updated', { interimTranscript });
          }
        }
        const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim();
        logToFile('Full transcript', { fullTranscript });
        onTranscriptionUpdate(fullTranscript);
      };
      
      // @ts-ignore TypeScriptのエラーを無視する
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logToFile('Speech recognition error', { error: event.error });
      };
      
      recognitionRef.current = recognition;
    } else {
      logToFile('Speech recognition not supported');
    }
  };

  const startRecording = async () => {
    try {
      logToFile('Starting recording');
      isCanceledRef.current = false;
      
      if (!streamRef.current) {
        await setupMediaStream();
      }
      
      if (!streamRef.current) {
        throw new Error('No media stream available');
      }

      // リセット処理
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      
      // 音声認識の初期化
      setupRecognition();

      // Set up MediaRecorder
      const recorder = new MediaRecorder(streamRef.current);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
        logToFile('Audio data chunk available', { 
          chunkSize: e.data.size,
          totalChunks: chunksRef.current.length 
        });
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const currentTranscript = finalTranscriptRef.current;

        setAudioBlob(blob);
        setAudioUrl(url);
        
        if (!isCanceledRef.current) {
          onRecordingStop(blob, url, currentTranscript);
        } else {
          logToFile('Recording was canceled, not sending results');
        }
      };
      
      setIsRecording(true);
      setMediaRecorder(recorder);
      
      recorder.start();
      
      // SpeechRecognitionの開始
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          logToFile('Speech recognition started');
        } catch (err) {
          logToFile('Error starting speech recognition', { error: err });
        }
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Unable to access your microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = (canceled: boolean = false) => {
    isCanceledRef.current = canceled;
    logToFile('Stopping recording', { 
      isCanceled: canceled,
      currentTranscript: finalTranscriptRef.current
    });
    
    if (mediaRecorder && isRecording) {
      // 現在のトランスクリプトを保存
      const savedFinalTranscript = finalTranscriptRef.current;
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = function() {
            logToFile('Speech recognition ended normally');
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            setIsRecording(false);
          };
          
          recognitionRef.current.stop();
        } catch (err) {
          logToFile('Error stopping recognition', { error: err });
          // 認識エラーの場合でもレコーダーを停止
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          setIsRecording(false);
        }
      } else {
        // 音声認識がない場合は単純にレコーダーを停止
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          logToFile('Error stopping recognition', { error: err });
        }
      }
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const cancelRecording = () => {
    stopRecording(true);
  };

  return (
    <div className="hidden">
      <button onClick={toggleRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <button onClick={cancelRecording}>
        Cancel Recording
      </button>
    </div>
  );
};

export default AudioRecorder;