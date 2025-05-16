import React, { createContext, useContext, useRef } from 'react';

interface AudioStopperContextType {
  registerAudio: (audio: HTMLAudioElement) => string;
  unregisterAudio: (id: string) => void;
  stopAllAudio: () => void;
}

const AudioStopperContext = createContext<AudioStopperContextType | undefined>(undefined);

export const useAudioStopper = () => {
  const context = useContext(AudioStopperContext);
  if (!context) {
    throw new Error('useAudioStopper must be used within an AudioStopperProvider');
  }
  return context;
};

export const AudioStopperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioMap = useRef<Record<string, HTMLAudioElement>>({});

  const registerAudio = (audio: HTMLAudioElement): string => {
    const id = Date.now().toString();
    audioMap.current[id] = audio;
    return id;
  };

  const unregisterAudio = (id: string) => {
    delete audioMap.current[id];
  };

  const stopAllAudio = () => {
    // 登録されている全ての音声を停止
    Object.values(audioMap.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // ブラウザの音声合成も停止
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <AudioStopperContext.Provider value={{ registerAudio, unregisterAudio, stopAllAudio }}>
      {children}
    </AudioStopperContext.Provider>
  );
}; 