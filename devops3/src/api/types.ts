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

// 백엔드 로그인 응답 타입
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number;
  user: {
    _id: string;
    email: string;
    nickname: string;
    role: string;
  };
}

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
  password?: string;
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
  isActive?: boolean; // 운영 상태

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
  targetType: "RESTAURANT" | "MENU";
  menuIds?: string[]; // Type.MENU인 경우 필요
  content?: string;
  rating: {
    menuRatings: Array<{
      menuId: string; // 백엔드는 menuId만 필요 (menuName 불필요)
      rating: number;
    }>;
    restaurantRating: number;
  };
  imageUrls?: string[];
}

// 학식 메뉴 리뷰 작성 요청 타입 (CreateReviewRequest와 동일하지만 명확성을 위해 유지)
export interface CreateMenuReviewRequest {
  restaurantId: string; // 교내 식당은 'MAIN_CAMPUS'
  targetType: "MENU";
  menuIds: string[]; // 단일 메뉴 ID 배열
  rating: {
    menuRatings: Array<{
      menuId: string; // 백엔드는 menuId만 필요
      rating: number;
    }>;
    restaurantRating?: number;
  };
  content?: string;
  imageUrls?: string[];
}

export interface ReviewUpdateRequest {
  content?: string;
  rating: {
    menuRatings: Array<{
      menuId: string; // 백엔드는 menuId만 필요
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
      menuId: string; // 백엔드 응답에 포함됨
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
  id: string;
  restaurantId: string;
  restaurantName: string;
  weekStartDate: string;
  dailyMenus: Array<{
    date: string;
    dayOfWeek: string;
    meals: Array<{
      corner: string;
      category: string;
      items: string[] | Array<{ _id?: string; id?: string; name: string; price: number }>;
      price: number;
    }>;
  }>;
}

// 리뷰 상세 응답 타입 (식당 상세 조회에 포함)
export interface ReviewDetailResponse {
  _id: string;
  userId: string;
  nickname: string;
  targetType?: "RESTAURANT" | "MENU";
  menuIds?: string[];
  rating: {  // 백엔드는 rating (단수) 사용
    menuRatings: Array<{
      menuId: string;
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
  imageUrl?: string | null;
  isActive?: boolean;  // 선택적으로 변경
  active?: boolean;    // 백엔드가 active를 보낼 수 있음
  stats: {
    rating: number;  // 백엔드는 rating 사용 (averageRating 아님)
    reviewCount: number;
    likeCount: number;
  };
  menu: Array<{
    id: string | null;  // id가 null일 수 있음
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
