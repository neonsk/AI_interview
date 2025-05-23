// 音声要素を生成し、指定した音量で返すユーティリティ
// デフォルト音量は0.2（0.0〜1.0）
export function createAudioWithVolume(src: string, volume: number = 0.2): HTMLAudioElement {
  const audio = new Audio(src);
  // iOS Safari判定
  const isIOSSafari =
    typeof window !== 'undefined' &&
    /iP(ad|hone|od)/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent) &&
    !/CriOS/.test(navigator.userAgent) &&
    !/FxiOS/.test(navigator.userAgent);

  if (isIOSSafari && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      // AudioContext + GainNodeで音量制御
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = context.createMediaElementSource(audio);
      const gainNode = context.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode).connect(context.destination);
      // SafariのAudioContextはユーザー操作後でないとresumeできない場合がある
      // play()時にresumeを試みる
      const origPlay = audio.play.bind(audio);
      audio.play = function() {
        if (context.state === 'suspended') {
          try { context.resume(); } catch (e) {}
        }
        // @ts-ignore 型の不一致を無視
        return origPlay.apply(audio, arguments);
      };
    } catch (e) {
      // 失敗した場合は従来通りvolumeで制御
      audio.volume = volume;
    }
  } else {
    audio.volume = volume;
  }
  return audio;
}
