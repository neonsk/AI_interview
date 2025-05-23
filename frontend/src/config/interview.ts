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

// フィードバック関連の設定
export const feedbackConfig = {
  // 無料ユーザーに表示する詳細フィードバックの質問数（ここで直接設定）
  freeDetailedFeedbackCount: 2,
} as const;