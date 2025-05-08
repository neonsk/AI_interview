export const interviewConfig = {
  // インタビュー時間（秒）
  duration: 180,

  // 音声認識の設定
  speech: {
    language: 'en-US',
    continuous: true,
    interimResults: true,
  },

  // 音声合成の設定
  synthesis: {
    language: 'en-US',
  },

  // 録音の設定
  recording: {
    mimeType: 'audio/webm',
  },
} as const;