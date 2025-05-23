// 音声要素を生成し、指定した音量で返すユーティリティ
// デフォルト音量は0.2（0.0〜1.0）
export function createAudioWithVolume(src: string, volume: number = 0.2): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = volume;
  return audio;
}
