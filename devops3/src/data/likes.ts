// 좋아요 데이터 구조
export interface Like {
  _id: string;
  userId: string;      // 좋아요를 누른 사용자
  reviewId: string;    // 좋아요가 눌린 리뷰
  createdAt: string;   // 좋아요 누른 시간
}

// Mock 좋아요 데이터
export const likesData : Like[] = [
  {
    _id: "like_1",
    userId: "507f191e810c19729de860e1", // 김철수
    reviewId: "507f191e810c19729de860eb", // 이영희의 리뷰
    createdAt: "2025-01-05T11:00:00Z"
  },
  {
    _id: "like_2",
    userId: "507f191e810c19729de860e1", // 김철수
    reviewId: "507f191e810c19729de860ec", // 박민수의 리뷰
    createdAt: "2025-01-05T12:00:00Z"
  },
  {
    _id: "like_3",
    userId: "507f191e810c19729de860e2", // 이영희
    reviewId: "507f191e810c19729de860ea", // 김철수의 리뷰
    createdAt: "2025-01-05T13:00:00Z"
  }
];

// 특정 사용자가 좋아요한 리뷰 ID 목록 가져오기
export function getLikesByUser(userId: string): string[] {
  return likesData
    .filter(like => like.userId === userId)
    .map(like => like.reviewId);
}

// 특정 리뷰에 좋아요를 누른 사용자 수
export function getLikeCountByReview(reviewId: string): number {
  return likesData.filter(like => like.reviewId === reviewId).length;
}

// 특정 사용자가 특정 리뷰에 좋아요를 눌렀는지 확인
export function hasUserLikedReview(userId: string, reviewId: string): boolean {
  return likesData.some(like => like.userId === userId && like.reviewId === reviewId);
}

// 좋아요 추가
export function addLike(userId: string, reviewId: string): Like {
  // 이미 좋아요를 눌렀는지 확인
  if (hasUserLikedReview(userId, reviewId)) {
    throw new Error('Already liked');
  }

  const newLike: Like = {
    _id: `like_${Date.now()}`,
    userId,
    reviewId,
    createdAt: new Date().toISOString()
  };

  likesData.push(newLike);
  return newLike;
}

// 좋아요 취소
export function removeLike(userId: string, reviewId: string): boolean {
  const index = likesData.findIndex(
    like => like.userId === userId && like.reviewId === reviewId
  );

  if (index === -1) return false;

  likesData.splice(index, 1);
  return true;
}

// 좋아요 토글 (추가 또는 제거)
export function toggleLike(userId: string, reviewId: string): boolean {
  if (hasUserLikedReview(userId, reviewId)) {
    removeLike(userId, reviewId);
    return false; // 좋아요 취소됨
  } else {
    addLike(userId, reviewId);
    return true; // 좋아요 추가됨
  }
}
