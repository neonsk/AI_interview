import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudioStopper } from '../context/AudioStopperContext';

/**
 * 画面遷移時に自動的に音声を停止するコンポーネント
 * App.tsx内でルーターと一緒に配置することで、
 * 画面遷移のたびに全ての登録済み音声を停止します
 */
const AudioStopper: React.FC = () => {
  const location = useLocation();
  const { stopAllAudio } = useAudioStopper();
  
  useEffect(() => {
    // 画面遷移（パス変更）が発生したら全ての音声を停止
    stopAllAudio();
    // パス変更を依存配列に入れることで、遷移のたびに実行される
  }, [location.pathname, stopAllAudio]);

  // 表示要素はなし（純粋な機能コンポーネント）
  return null;
};

export default AudioStopper; 