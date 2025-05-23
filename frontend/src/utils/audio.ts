// 音声要素を生成し、指定した音量で返すユーティリティ
// デフォルト音量は0.2（0.0〜1.0）
export function createAudioWithVolume(src: string, volume: number = 0.4): HTMLAudioElement {
  const audio = new Audio(src);
  // iOS Safari判定
  const isIOSSafari =
    typeof window !== 'undefined' &&
    /iP(ad|hone|od)/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent) &&
    !/CriOS/.test(navigator.userAgent) &&
    !/FxiOS/.test(navigator.userAgent);

  console.log('[audio] createAudioWithVolume', { src, volume, isIOSSafari, userAgent: navigator.userAgent });

  if (isIOSSafari && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      // AudioContext + GainNodeで音量制御
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = context.createMediaElementSource(audio);
      const gainNode = context.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode).connect(context.destination);
      audio.volume = 0; // Safariバグ対策: audioタグから直接出る音を消す
      console.log('[audio] iOS Safari: AudioContext+GainNodeで音量制御', { gain: gainNode.gain.value, contextState: context.state });
      // play()時にresumeの完了をawaitしてから再生
      const origPlay = audio.play.bind(audio);
      audio.play = async function() {
        if (context.state === 'suspended') {
          console.log('[audio] AudioContext state suspended, try resume (await)');
          try { await context.resume(); } catch (e) { console.warn('[audio] context.resume() error', e); }
        }
        // @ts-ignore 型の不一致を無視
        return origPlay.apply(audio, arguments);
      };
    } catch (e) {
      console.warn('[audio] iOS Safari: AudioContext+GainNode失敗 fallback to audio.volume', e);
      audio.volume = volume;
      console.log('[audio] fallback audio.volume set', { volume: audio.volume });
    }
  } else {
    audio.volume = volume;
    console.log('[audio] 非iOSまたはAudioContext未対応: audio.volume set', { volume: audio.volume });
  }
  return audio;
}
