// ブラウザ環境用のシンプルなロガー実装
export const logToFile = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data
  };

  // 開発環境でのデバッグ用にコンソールに出力
  console.log('Log Entry:', logEntry);
};