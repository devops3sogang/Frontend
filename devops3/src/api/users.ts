import apiClient from "./client";
import type { UserProfileResponse, UpdateProfileRequest, DeleteAccountRequest } from "./types";

// 현재 로그인한 사용자의 통합 프로필 조회 (내가 작성한 리뷰 + 좋아요한 리뷰)
export const getMyProfile = async (): Promise<UserProfileResponse> => {
  const response = await apiClient.get<UserProfileResponse>("/users/me");
  return response.data;
};

// 현재 로그인한 사용자의 프로필 수정
export const updateMyProfile = async (
  data: UpdateProfileRequest
): Promise<void> => {
  await apiClient.put("/users/me", data);
};

// 현재 로그인한 사용자 탈퇴
export const deleteMyAccount = async (data: DeleteAccountRequest): Promise<void> => {
  await apiClient.delete("/users/me", { data });
};
