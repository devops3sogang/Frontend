// 백엔드 API 요청/응답 타입 정의

// 인증 관련 타입
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// 백엔드가 토큰 문자열만 반환하는 경우도 있고, 객체로 반환하는 경우도 있음
export type LoginResponse =
  | string
  | {
      token: string;
      user?: {
        id: string;
        email: string;
        nickname: string;
      };
    };

// 사용자 프로필 타입 (GET /users/me 응답)
export interface UserProfile {
  _id: string;
  email: string;
  nickname: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface DeleteAccountRequest {
  password: string;
}

// 프로필 수정 응답 타입 (명세서 기준)
export interface UpdateProfileResponse {
  _id: string;
  email: string;
  nickname: string;
  updatedAt: string;
}

// 사용자 통합 프로필 응답 타입
export interface UserProfileResponse {
  _id: string;
  email: string;
  nickname: string;
  role: string;
  createdAt: string;
  myReviews: ReviewResponse[];
  likedReviews: ReviewResponse[];
}

// 맛집 관련 타입
export interface CreateRestaurantRequest {
  name: string;
  type: "ON_CAMPUS" | "OFF_CAMPUS";
  category: string;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [경도, 위도]
  };
  imageUrl?: string;

  // 메뉴 최소 1개 이상 필수
  menu: Array<MenuItemInput>;
}

// 업데이트 요청 타입이 별도로 필요하면 동일 구조 사용
export type UpdateRestaurantRequest = CreateRestaurantRequest;

export interface RestaurantListParams {
  lat?: number;
  lng?: number;
  type?: "ON_CAMPUS" | "OFF_CAMPUS";
  category?: string;
  radius?: number;
  sortBy?: "NONE" | "DISTANCE" | "RATING" | "REVIEW_COUNT";
}

// 메뉴 타입 (요청용)
export interface MenuItemInput {
  name: string;
  price: number;
}

// 리뷰 관련 타입
export interface CreateReviewRequest {
  restaurantId: string;
  restaurantName: string;
  ratings: {
    menuRatings: Array<{
      menuName: string;
      rating: number;
    }>;
    restaurantRating: number;
  };
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface ReviewUpdateRequest {
  content?: string;
  ratings: {
    menuRatings: Array<{
      menuName: string;
      rating: number;
    }>;
    restaurantRating: number;
  };
  imageUrls?: string[];
}

export interface ReviewResponse {
  _id: string;
  userId: string;
  nickname: string;
  target: {
    restaurantId: string;
    restaurantName: string;
  };
  // 하위 호환성을 위해 최상위 레벨에도 유지
  restaurantId?: string;
  restaurantName?: string;
  ratings: {
    menuRatings: Array<{
      menuName: string;
      rating: number;
    }>;
    restaurantRating: number;
  };
  content: string;
  imageUrls?: string[];
  likeCount: number;
  createdAt: string;
  likedByCurrentUser: boolean;
}

// 교내 메뉴 타입
export interface OnCampusMenuResponse {
  date: string;
  menus: Array<{
    restaurantName: string;
    items: string[];
  }>;
}

// 리뷰 상세 응답 타입 (식당 상세 조회에 포함)
export interface ReviewDetailResponse {
  _id: string;
  userId: string;
  nickname: string;
  ratings: {
    menuRatings: Array<{
      menuName: string;
      rating: number;
    }>;
    restaurantRating: number;
  };
  content?: string;
  imageUrls?: string[];
  likeCount: number;
  createdAt: string;
  likedByCurrentUser: boolean;
}

// 식당 상세 조회 응답 타입
export interface RestaurantDetailResponse {
  _id: string;
  name: string;
  type: "ON_CAMPUS" | "OFF_CAMPUS";
  category: string;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [경도, 위도]
  };
  imageUrl?: string;
  isActive: boolean;
  stats: {
    averageRating: number;
    reviewCount: number;
  };
  menu: Array<{
    name: string;
    price: number;
  }>;
  reviews?: ReviewDetailResponse[];
  createdAt: string;
  updatedAt: string;
}

// 좋아요 토글 응답 타입
export interface ToggleLikeResponse {
  createdLike: {
    _id: string;
    userId: string;
    reviewId: string;
    createdAt: string;
  };
  likeCount: number;
}
