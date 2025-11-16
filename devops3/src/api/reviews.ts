import apiClient from "./client";
import type {
  CreateReviewRequest,
  ReviewResponse,
  ReviewUpdateRequest,
  ToggleLikeResponse,
} from "./types";

// 리뷰 작성
export const createReview = async (
  restaurantId: string,
  data: CreateReviewRequest
): Promise<ReviewResponse> => {
  const response = await apiClient.post<ReviewResponse>(
    `/restaurants/${restaurantId}/reviews`,
    data
  );
  return response.data;
};

// 특정 맛집의 리뷰 목록 조회
export const getRestaurantReviews = async (
  restaurantId: string
): Promise<ReviewResponse[]> => {
  const response = await apiClient.get<ReviewResponse[]>(
    `/restaurants/${restaurantId}/reviews`
  );
  return response.data;
};

// 리뷰 좋아요 토글
export const toggleReviewLike = async (reviewId: string): Promise<ToggleLikeResponse> => {
  const response = await apiClient.post<ToggleLikeResponse>(`/reviews/${reviewId}/like`);
  return response.data;
};

// 최신 리뷰 목록 조회 (모든 맛집)
export const getAllReviews = async (): Promise<ReviewResponse[]> => {
  try {
    // 백엔드에 전체 리뷰 조회 API가 없다면 모든 맛집의 리뷰를 가져와야 함
    // 임시로 빈 배열 반환 (백엔드 API 추가 필요)
    const response = await apiClient.get<ReviewResponse[]>("/reviews");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch all reviews:", error);
    return [];
  }
};

// 내가 좋아요 누른 리뷰 목록
export const getMyLikedReviews = async (): Promise<ReviewResponse[]> => {
  const response = await apiClient.get<ReviewResponse[]>("/users/me/likes");
  return response.data;
};

// 리뷰 수정
export const updateReview = async (
  reviewId: string,
  data: ReviewUpdateRequest
): Promise<ReviewResponse> => {
  const response = await apiClient.put<ReviewResponse>(
    `/reviews/${reviewId}`,
    data
  );
  return response.data;
};

// 리뷰 삭제
export const deleteReview = async (reviewId: string): Promise<void> => {
  await apiClient.delete(`/reviews/${reviewId}`);
};
