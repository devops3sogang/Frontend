import apiClient from "./client";
import type {
  CreateRestaurantRequest,
  RestaurantListParams,
  RestaurantDetailResponse,
} from "./types";
import type { Restaurant } from "../data/places";

// 기존: 공개 엔드포인트 -------------------------------------------------

export const createRestaurant = async (
  data: CreateRestaurantRequest
): Promise<Restaurant> => {
  const res = await apiClient.post<Restaurant>("/restaurants", data);
  return res.data;
};

export const getRestaurants = async (
  params?: RestaurantListParams
): Promise<Restaurant[]> => {
  const res = await apiClient.get<Restaurant[]>("/restaurants", { params });
  return res.data;
};

export const getRestaurant = async (
  id: string
): Promise<RestaurantDetailResponse> => {
  const res = await apiClient.get<RestaurantDetailResponse>(`/restaurants/${id}`);
  return res.data;
};

// 관리자 전용: /admin ----------------------------------------------------

// 목록(필요 시 서버에서만 필요한 확장 필드 포함 가능)
export const adminGetRestaurants = async (): Promise<Restaurant[]> => {
  const res = await apiClient.get<Restaurant[]>("/admin/restaurants");
  return res.data;
};

// 생성
export const adminCreateRestaurant = async (
  payload: CreateRestaurantRequest
): Promise<Restaurant> => {
  const res = await apiClient.post<Restaurant>("/admin/restaurants", payload);
  return res.data;
};

// 수정
export const adminUpdateRestaurant = async (
  restaurantId: string,
  payload: CreateRestaurantRequest
): Promise<Restaurant> => {
  const res = await apiClient.put<Restaurant>(`/admin/restaurants/${restaurantId}`, payload);
  return res.data;
};

// 삭제
export const adminDeleteRestaurant = async (restaurantId: string): Promise<void> => {
  await apiClient.delete(`/admin/restaurants/${restaurantId}`);
};