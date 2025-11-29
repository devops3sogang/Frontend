import apiClient from "./client";

export interface ImageUploadResponse {
  imageUrl: string;
  message: string;
}

/**
 * 이미지 파일 업로드
 * @param file 업로드할 이미지 파일
 * @returns 업로드된 이미지 URL
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ImageUploadResponse>(
    "/images/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.imageUrl;
};
