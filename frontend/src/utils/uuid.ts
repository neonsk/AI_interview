// UUIDの取得・生成・保存用ユーティリティ
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('user_id', userId);
  }
  return userId;
}
