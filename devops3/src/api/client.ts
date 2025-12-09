import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// 백엔드 API 베이스 URL (개발 환경)
// Vite 프록시를 사용하므로 상대 경로로 변경
const API_BASE_URL = "/api";

// 토큰 갱신 상태 관리
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

// 대기 중인 요청들 처리
const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 토큰 갱신 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러가 아니면 그냥 reject
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 로그인/회원가입/토큰갱신 요청에서 발생한 401은 무시
    const currentPath = window.location.pathname;
    const requestUrl = originalRequest?.url || "";
    if (
      currentPath === "/login" ||
      currentPath === "/signup" ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    // 이미 재시도한 요청이면 로그아웃
    if (originalRequest._retry) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 이미 토큰 갱신 중이면 큐에 추가하고 대기
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // 토큰 갱신 시도
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // refresh 요청은 apiClient 대신 axios 직접 사용 (인터셉터 무한루프 방지)
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // 새 토큰 저장
      localStorage.setItem("jwt_token", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      // 대기 중인 요청들 처리
      processQueue(null, accessToken);

      // 원래 요청 재시도
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      // 토큰 갱신 실패 → 로그아웃
      processQueue(refreshError as AxiosError, null);
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
