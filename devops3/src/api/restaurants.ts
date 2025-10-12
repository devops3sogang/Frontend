import apiClient from "./client";
import type {
  CreateRestaurantRequest,
  RestaurantListParams,
  RestaurantDetailResponse,
} from "./types";
import type { Restaurant } from "../data/places";

// 맛집 등록
export const createRestaurant = async (
  data: CreateRestaurantRequest
): Promise<Restaurant> => {
  const response = await apiClient.post<Restaurant>("/restaurants", data);
  return response.data;
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
