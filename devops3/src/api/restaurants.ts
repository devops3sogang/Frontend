import apiClient from "./client";
import type {
  CreateRestaurantRequest,
  RestaurantListParams,
  RestaurantDetailResponse,
} from "./types";
import type { Restaurant } from "../data/places";

// 관리자: 맛집 생성
export const adminCreateRestaurant = async (data: CreateRestaurantRequest) => {
  const res = await apiClient.post("/admin/restaurants", data);
  return res.data;
};

// 맛집 목록 조회
export const getRestaurants = async (
  params?: RestaurantListParams
): Promise<Restaurant[]> => {
  const response = await apiClient.get<Restaurant[]>("/restaurants", {
    params,
  });
  return response.data;
};

// 맛집 상세 조회
export const getRestaurant = async (
  id: string
): Promise<RestaurantDetailResponse> => {
  const response = await apiClient.get<RestaurantDetailResponse>(
    `/restaurants/${id}`
  );
  return response.data;
};

// 관리자: 맛집 수정
export const adminUpdateRestaurant = async (id: string, data: CreateRestaurantRequest) => {
  const res = await apiClient.put(`/admin/restaurants/${id}`, data);
  return res.data;
};

// 관리자: 맛집 삭제
export const adminDeleteRestaurant = async (id: string) => {
  const res = await apiClient.delete(`/admin/restaurants/${id}`);
  return res.data;
};