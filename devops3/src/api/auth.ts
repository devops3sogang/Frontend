import apiClient from "./client";
import type {
  SignupRequest,
  LoginRequest,
  LoginResponse,
  UserProfile,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "./types";

// 회원가입
export const signup = async (data: SignupRequest) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};

// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", data);
  return response.data;
};

// 내 프로필 조회
export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>("/users/me");
  return response.data;
};

// 내 프로필 수정
export const updateMyProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.put<UpdateProfileResponse>("/users/me", data);
  console.log("updateMyProfile - Full response:", response);
  console.log("updateMyProfile - Response data:", response.data);
  return response.data;
};

// 회원 탈퇴
export const deleteMyAccount = async () => {
  const response = await apiClient.delete("/users/me");
  return response.data;
};

// JWT 토큰 저장
export const saveToken = (token: string) => {
  localStorage.setItem("jwt_token", token);
};

// JWT 토큰 조회
export const getToken = (): string | null => {
  return localStorage.getItem("jwt_token");
};

// JWT 토큰 삭제
export const removeToken = () => {
  localStorage.removeItem("jwt_token");
};
