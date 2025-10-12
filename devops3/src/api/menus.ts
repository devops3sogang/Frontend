import apiClient from "./client";
import type { OnCampusMenuResponse } from "./types";

// 교내 식당 메뉴 조회
export const getOnCampusMenus = async (
  date: string
): Promise<OnCampusMenuResponse> => {
  const response = await apiClient.get<OnCampusMenuResponse>(
    "/on-campus-menus",
    {
      params: { date },
    }
  );
  return response.data;
};
