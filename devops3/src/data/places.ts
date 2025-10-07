// 식당 타입
export type RestaurantType = 'ON_CAMPUS' | 'OFF_CAMPUS';

// 메뉴 아이템 구조
export interface MenuItem {
  name: string;
  price: number;
}

// 식당 통계 정보
export interface RestaurantStats {
  averageRating: number;
  reviewCount: number;
}

// 위치 정보 (GeoJSON Point)
export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [경도, 위도]
}

// 식당 데이터 구조
export interface Restaurant {
  _id: string; // MongoDB ObjectId
  name: string;
  type: RestaurantType;
  category: string;
  address: string;
  location: Location;
  imageUrl?: string;
  isActive: boolean;
  stats: RestaurantStats;
  menu?: MenuItem[]; // 교외 식당만 메뉴 정보 포함
  createdAt: string;
  updatedAt: string;
}

// 리뷰 대상 타입
export type ReviewTargetType = 'RESTAURANT' | 'MENU';

// 리뷰 대상 정보
export interface ReviewTarget {
  type: ReviewTargetType;
  restaurantId: string;
  restaurantName: string;
  menuItems?: string; // 리뷰 대상 메뉴 (선택 사항)
}

// 리뷰 평점 정보
export interface ReviewRatings {
  taste: number;
  price: number;
  atmosphere: number;
}

// 리뷰 데이터 구조
export interface Review {
  _id: string; // MongoDB ObjectId
  userId: string;
  nickname: string;
  target: ReviewTarget;
  ratings: ReviewRatings;
  content: string;
  imageUrl?: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// 목 데이터 - 식당 (나중에 백엔드에서 가져올 예정)
export const restaurantsData: Restaurant[] = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "맛있는 김밥",
    type: "OFF_CAMPUS",
    category: "분식",
    address: "서울특별시 마포구 백범로 1",
    location: {
      type: "Point",
      coordinates: [126.9780, 37.5665]
    },
    imageUrl: "https://example.com/kimbap.jpg",
    isActive: true,
    stats: {
      averageRating: 4.5,
      reviewCount: 2
    },
    menu: [
      { name: "참치김밥", price: 3000 },
      { name: "치즈김밥", price: 3500 },
      { name: "김치김밥", price: 3000 },
      { name: "돈까스", price: 6000 }
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "행복한 돈까스",
    type: "OFF_CAMPUS",
    category: "일식",
    address: "서울특별시 마포구 백범로 2",
    location: {
      type: "Point",
      coordinates: [126.9800, 37.5700]
    },
    imageUrl: "https://example.com/donkatsu.jpg",
    isActive: true,
    stats: {
      averageRating: 4.8,
      reviewCount: 1
    },
    menu: [
      { name: "등심돈까스", price: 8000 },
      { name: "치즈돈까스", price: 9000 },
      { name: "생선까스", price: 8500 }
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439013",
    name: "정통 한식당",
    type: "OFF_CAMPUS",
    category: "한식",
    address: "서울특별시 마포구 백범로 3",
    location: {
      type: "Point",
      coordinates: [126.9750, 37.5650]
    },
    imageUrl: "https://example.com/korean.jpg",
    isActive: true,
    stats: {
      averageRating: 4.2,
      reviewCount: 1
    },
    menu: [
      { name: "김치찌개", price: 7000 },
      { name: "된장찌개", price: 7000 },
      { name: "제육볶음", price: 8000 },
      { name: "불고기", price: 9000 }
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439014",
    name: "파스타 하우스",
    type: "OFF_CAMPUS",
    category: "양식",
    address: "서울특별시 마포구 백범로 4",
    location: {
      type: "Point",
      coordinates: [126.9820, 37.5630]
    },
    imageUrl: "https://example.com/pasta.jpg",
    isActive: true,
    stats: {
      averageRating: 4.7,
      reviewCount: 1
    },
    menu: [
      { name: "까르보나라", price: 12000 },
      { name: "토마토파스타", price: 11000 },
      { name: "알리오올리오", price: 10000 },
      { name: "크림파스타", price: 12000 }
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

// 목 데이터 - 리뷰 (나중에 백엔드에서 가져올 예정)
export const reviewsData: Review[] = [
  {
    _id: "507f191e810c19729de860ea",
    userId: "507f191e810c19729de860e1",
    nickname: "김철수",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439011",
      restaurantName: "맛있는 김밥",
      menuItems: "참치김밥"
    },
    ratings: {
      taste: 5,
      price: 4,
      atmosphere: 4
    },
    content: "김밥이 정말 맛있어요! 참치가 많이 들어있습니다.",
    likeCount: 15,
    createdAt: "2025-01-05T10:30:00Z",
    updatedAt: "2025-01-05T10:30:00Z"
  },
  {
    _id: "507f191e810c19729de860eb",
    userId: "507f191e810c19729de860e2",
    nickname: "이영희",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439011",
      restaurantName: "맛있는 김밥",
      menuItems: "돈까스"
    },
    ratings: {
      taste: 5,
      price: 5,
      atmosphere: 5
    },
    content: "가성비 최고! 양도 푸짐해요.",
    imageUrl: "https://example.com/photo1.jpg",
    likeCount: 23,
    createdAt: "2025-01-04T14:20:00Z",
    updatedAt: "2025-01-04T14:20:00Z"
  },
  {
    _id: "507f191e810c19729de860ec",
    userId: "507f191e810c19729de860e3",
    nickname: "박민수",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439012",
      restaurantName: "행복한 돈까스",
      menuItems: "등심돈까스"
    },
    ratings: {
      taste: 5,
      price: 4,
      atmosphere: 5
    },
    content: "돈까스가 바삭하고 소스가 맛있어요.",
    likeCount: 30,
    createdAt: "2025-01-03T12:15:00Z",
    updatedAt: "2025-01-03T12:15:00Z"
  },
  {
    _id: "507f191e810c19729de860ed",
    userId: "507f191e810c19729de860e4",
    nickname: "최지훈",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439013",
      restaurantName: "정통 한식당",
      menuItems: "김치찌개"
    },
    ratings: {
      taste: 4,
      price: 4,
      atmosphere: 4
    },
    content: "집밥 같은 맛이에요. 반찬도 잘 나옵니다.",
    likeCount: 18,
    createdAt: "2025-01-02T11:45:00Z",
    updatedAt: "2025-01-02T11:45:00Z"
  },
  {
    _id: "507f191e810c19729de860ee",
    userId: "507f191e810c19729de860e5",
    nickname: "정수진",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439014",
      restaurantName: "파스타 하우스",
      menuItems: "까르보나라"
    },
    ratings: {
      taste: 5,
      price: 4,
      atmosphere: 5
    },
    content: "파스타 면발이 쫄깃하고 크림소스가 진해요.",
    imageUrl: "https://example.com/photo2.jpg",
    likeCount: 25,
    createdAt: "2025-01-01T19:30:00Z",
    updatedAt: "2025-01-01T19:30:00Z"
  }
];

// 식당의 평균 별점 계산 헬퍼 함수 (맛, 가격, 분위기 평균)
export function getAverageRating(restaurantId: string): number {
  const restaurantReviews = reviewsData.filter(
    review => review.target.restaurantId === restaurantId
  );

  if (restaurantReviews.length === 0) return 0;

  const totalRating = restaurantReviews.reduce(
    (sum, review) => {
      const avgRating = (review.ratings.taste + review.ratings.price + review.ratings.atmosphere) / 3;
      return sum + avgRating;
    },
    0
  );

  return totalRating / restaurantReviews.length;
}

// 식당의 리뷰 개수 가져오기
export function getReviewCount(restaurantId: string): number {
  return reviewsData.filter(
    review => review.target.restaurantId === restaurantId
  ).length;
}
