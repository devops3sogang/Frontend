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

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  password?: string;
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
}

export interface RestaurantListParams {
  type?: "ON_CAMPUS" | "OFF_CAMPUS";
  category?: string;
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

export interface ReviewResponse {
  _id: string;
  userId: string;
  nickname: string;
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
  imageUrls?: string[];
  likeCount: number;
  createdAt: string;
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
  isLikedByCurrentUser: boolean;
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
