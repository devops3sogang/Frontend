/**
 * 이미지 URL을 전체 URL로 변환
 * 백엔드에서 상대 경로로 반환되는 이미지 URL을 절대 경로로 변환
 */
export function getFullImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;

  // 이미 http/https로 시작하면 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // /uploads/로 시작하면 /api 프리픽스 추가
  if (imageUrl.startsWith('/uploads/')) {
    return `/api${imageUrl}`;
  }

  // /api로 이미 시작하면 그대로 반환
  if (imageUrl.startsWith('/api/')) {
    return imageUrl;
  }

  // 그 외의 경우 그대로 반환
  return imageUrl;
}
