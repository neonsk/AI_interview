import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { logToFile } from '../utils/logger';
import { interviewConfig } from '../config/interview';
import { interviewApi } from '../services/api';

// Google Cloud Speech-to-Text API レスポンスの型定義
interface SpeechToTextResponse {
  transcript: string;
  error?: string;
}

interface AudioRecorderProps {
  onTranscriptionUpdate: (text: string) => void;
  onRecordingStop: (audioBlob?: Blob, audioUrl?: string, transcript?: string) => void;
  onSpeakingStatusChange?: (isSpeaking: boolean) => void;
}

export interface AudioRecorderHandle {
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
}

const AudioRecorder = forwardRef<AudioRecorderHandle, AudioRecorderProps>(
  ({ onTranscriptionUpdate, onRecordingStop, onSpeakingStatusChange }, ref) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const isCanceledRef = useRef<boolean>(false);
    // 音声監視用
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const speakingIntervalRef = useRef<number | null>(null);
    const isSpeakingRef = useRef<boolean>(false);

    useEffect(() => {
      setupMediaStream();
      return () => {
        stopRecording();
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        cleanupSpeakingMonitor();
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

    // 音声ボリューム監視のセットアップ
    const setupSpeakingMonitor = () => {
      if (!streamRef.current) return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      isSpeakingRef.current = false;
      // 監視ループ
      speakingIntervalRef.current = window.setInterval(() => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        // RMS計算
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const threshold = 0.02; // しきい値（調整可）
        const speaking = rms > threshold;
        if (speaking !== isSpeakingRef.current) {
          isSpeakingRef.current = speaking;
          if (onSpeakingStatusChange) onSpeakingStatusChange(speaking);
        }
      }, 100);
    };

    // 音声監視のクリーンアップ
    const cleanupSpeakingMonitor = () => {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
        speakingIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      isSpeakingRef.current = false;
      if (onSpeakingStatusChange) onSpeakingStatusChange(false);
    };

    // Google Cloud Speech-to-Text APIにデータを送信し、テキストを取得する関数
    const recognizeSpeech = async (audioBlob: Blob): Promise<string> => {
      try {
        logToFile('Sending audio data to Speech-to-Text API', { blobSize: audioBlob.size });
        // APIサービスの音声認識メソッドを使用
        const transcript = await interviewApi.recognizeSpeech(
          audioBlob,
          interviewConfig.speech.language
        );
        return transcript || '';
      } catch (error) {
        logToFile('Error recognizing speech', { error });
        return '';
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

        // 音声監視開始
        setupSpeakingMonitor();

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
        
        recorder.onstop = async () => {
          cleanupSpeakingMonitor();
          const blob = new Blob(chunksRef.current, { type: interviewConfig.recording.mimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setAudioUrl(url);
          
          if (!isCanceledRef.current) {
            // 録音終了時のみ音声認識を実行
            let finalTranscript = '';
            if (chunksRef.current.length > 0) {
              try {
                finalTranscript = await recognizeSpeech(blob);
              } catch (error) {
                logToFile('Error in final recognition', { error });
              }
            }
            onRecordingStop(blob, url, finalTranscript);
          } else {
            logToFile('Recording was canceled, not sending results');
          }
        };
        
        setIsRecording(true);
        setMediaRecorder(recorder);
        recorder.start();
      } catch (err) {
        console.error('Error starting recording:', err);
        alert('Unable to access your microphone. Please check permissions and try again.');
      }
    };

    const stopRecording = (canceled: boolean = false) => {
      isCanceledRef.current = canceled;
      logToFile('Stopping recording', { 
        isCanceled: canceled
      });
      if (mediaRecorder && isRecording) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      } else {
        setIsRecording(false);
      }
      setTimeout(() => {
        setMediaRecorder(null);
      }, 100);
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

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
      cancelRecording,
    }));

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
  }
);

export default AudioRecorder;