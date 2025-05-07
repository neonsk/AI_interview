import React, { useEffect, useRef, useState } from 'react';
import { logToFile } from '../utils/logger';
import { interviewConfig } from '../config/interview';

interface AudioRecorderProps {
  onTranscriptionUpdate: (text: string) => void;
  onRecordingStop: (audioBlob?: Blob, audioUrl?: string) => void;
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
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = interviewConfig.speech.continuous;
      recognition.interimResults = interviewConfig.speech.interimResults;
      recognition.lang = interviewConfig.speech.language;
      
      recognition.onresult = (event) => {
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
      recognition.onerror = (event) => {
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
      if (!streamRef.current) {
        await setupMediaStream();
      }
      
      if (!streamRef.current) {
        throw new Error('No media stream available');
      }

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
        
        logToFile('Recording stopped', { 
          blobSize: blob.size,
          audioUrl: url 
        });
        
        setAudioBlob(blob);
        setAudioUrl(url);
        onRecordingStop(blob, url);
      };
      
      setIsRecording(true);
      setMediaRecorder(recorder);
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      
      recorder.start();
      
      // Start speech recognition if available
      setupRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Unable to access your microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      logToFile('Stopping recording');
      
      // 音声認識の停止を遅延させて、最後の認識結果を確実に取得
      const finalTranscript = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
      logToFile('Final transcript before stopping', { finalTranscript });
      onTranscriptionUpdate(finalTranscript);

      // 音声認識を先に停止
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          logToFile('Error stopping recognition', { error: err });
        }
      }

      // 少し待ってからMediaRecorderを停止
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
      }, 100);
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

  return (
    <div className="hidden">
      <button onClick={toggleRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default AudioRecorder;