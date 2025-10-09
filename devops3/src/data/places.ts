import { hasUserLikedReview, toggleLike } from "./likes";

// 식당 타입
export type RestaurantType = "ON_CAMPUS" | "OFF_CAMPUS";

// 메뉴 아이템 구조
export interface MenuItem {
  name: string; // 메뉴 이름
  price: number; // 메뉴 가격 (원 단위)
}

// 식당 통계 정보
export interface RestaurantStats {
  averageRating: number; // 평균 별점
  reviewCount: number; // 리뷰 수
}

// 위치 정보 (GeoJSON Point)
export interface Location {
  type: "Point";
  coordinates: [number, number]; // [경도, 위도]
}

// 식당 데이터 구조
export interface Restaurant {
  _id: string; // MongoDB ObjectId
  name: string; // 식당 이름
  type: RestaurantType; // 식당 유형
  category: string; // 식당 카테고리
  address: string; // 식당 주소
  location: Location; // 식당 위치 (GeoJSON Point)
  imageUrl?: string; // 식당 이미지 URL
  isActive: boolean; // 관리자가 비활성화할 수 있는 토글
  stats: RestaurantStats; // 리뷰 정보를 요약하여 저장 (평균 별점, 리뷰 수)
  menu?: MenuItem[]; // 교외 식당만 메뉴 정보 포함?
  createdAt: string; // 생성 날짜
  updatedAt: string; // 수정 날짜
}

// 리뷰 대상 타입
export type ReviewTargetType = "RESTAURANT" | "MENU";

// 리뷰 대상 정보
export interface ReviewTarget {
  type: ReviewTargetType; // 리뷰 대상 타입
  restaurantId: string; // 대상 식당 ID
  restaurantName: string; // 대상 식당 이름
  menuItems?: string; // 리뷰 대상 메뉴 (선택 사항)
}

// 메뉴별 평점 정보
export interface MenuRating {
  menuName: string; // 메뉴 이름
  rating: number; // 메뉴 별점 (1~5)
}

// 리뷰 평점 정보
export interface ReviewRatings {
  menuRatings: MenuRating[]; // 메뉴별 별점
  restaurantRating: number; // 가게 전체 별점
}

// 리뷰 데이터 구조
export interface Review {
  _id: string; // MongoDB ObjectId
  userId: string; // 리뷰 작성자 (사용자 ID)
  nickname: string; // 리뷰 작성자 닉네임
  target: ReviewTarget; // 리뷰 대상 (식당 또는 메뉴)
  ratings: ReviewRatings; // 리뷰 평점 정보
  content: string; // 리뷰 내용
  imageUrl?: string; // 하위 호환성을 위해 유지
  imageUrls?: string[]; // 여러 이미지 지원
  likeCount: number; // 좋아요 수
  createdAt: string; // 생성 날짜
  updatedAt: string; // 수정 날짜
}

// Mock 데이터 - 식당 (나중에 백엔드에서 가져올 예정)
export const restaurantsData: Restaurant[] = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "맛있는 김밥",
    type: "OFF_CAMPUS",
    category: "분식",
    address: "서울특별시 마포구 백범로 1",
    location: {
      type: "Point",
      coordinates: [126.978, 37.5665],
    },
    imageUrl: "https://example.com/kimbap.jpg",
    isActive: true,
    stats: {
      averageRating: 4.5,
      reviewCount: 2,
    },
    menu: [
      { name: "참치김밥", price: 3000 },
      { name: "치즈김밥", price: 3500 },
      { name: "김치김밥", price: 3000 },
      { name: "돈까스", price: 6000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "행복한 돈까스",
    type: "OFF_CAMPUS",
    category: "일식",
    address: "서울특별시 마포구 백범로 2",
    location: {
      type: "Point",
      coordinates: [126.98, 37.57],
    },
    imageUrl: "https://example.com/donkatsu.jpg",
    isActive: true,
    stats: {
      averageRating: 4.8,
      reviewCount: 1,
    },
    menu: [
      { name: "등심돈까스", price: 8000 },
      { name: "치즈돈까스", price: 9000 },
      { name: "생선까스", price: 8500 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439013",
    name: "정통 한식당",
    type: "OFF_CAMPUS",
    category: "한식",
    address: "서울특별시 마포구 백범로 3",
    location: {
      type: "Point",
      coordinates: [126.975, 37.565],
    },
    imageUrl: "https://example.com/korean.jpg",
    isActive: true,
    stats: {
      averageRating: 4.2,
      reviewCount: 1,
    },
    menu: [
      { name: "김치찌개", price: 7000 },
      { name: "된장찌개", price: 7000 },
      { name: "제육볶음", price: 8000 },
      { name: "불고기", price: 9000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439014",
    name: "파스타 하우스",
    type: "OFF_CAMPUS",
    category: "양식",
    address: "서울특별시 마포구 백범로 4",
    location: {
      type: "Point",
      coordinates: [126.982, 37.563],
    },
    imageUrl: "https://example.com/pasta.jpg",
    isActive: true,
    stats: {
      averageRating: 4.7,
      reviewCount: 1,
    },
    menu: [
      { name: "까르보나라", price: 12000 },
      { name: "토마토파스타", price: 11000 },
      { name: "알리오올리오", price: 10000 },
      { name: "크림파스타", price: 12000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439015",
    name: "중화요리 만리장성",
    type: "OFF_CAMPUS",
    category: "중식",
    address: "서울특별시 마포구 백범로 5",
    location: {
      type: "Point",
      coordinates: [126.977, 37.568],
    },
    imageUrl: "https://example.com/chinese.jpg",
    isActive: true,
    stats: {
      averageRating: 4.4,
      reviewCount: 2,
    },
    menu: [
      { name: "짜장면", price: 6000 },
      { name: "짬뽕", price: 7000 },
      { name: "탕수육", price: 15000 },
      { name: "볶음밥", price: 7000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439016",
    name: "치킨왕국",
    type: "OFF_CAMPUS",
    category: "치킨",
    address: "서울특별시 마포구 백범로 6",
    location: {
      type: "Point",
      coordinates: [126.979, 37.564],
    },
    imageUrl: "https://example.com/chicken.jpg",
    isActive: true,
    stats: {
      averageRating: 4.6,
      reviewCount: 2,
    },
    menu: [
      { name: "후라이드치킨", price: 16000 },
      { name: "양념치킨", price: 17000 },
      { name: "반반치킨", price: 17000 },
      { name: "감자튀김", price: 3000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439017",
    name: "라멘 가게 혼",
    type: "OFF_CAMPUS",
    category: "일식",
    address: "서울특별시 마포구 백범로 7",
    location: {
      type: "Point",
      coordinates: [126.981, 37.572],
    },
    imageUrl: "https://example.com/ramen.jpg",
    isActive: true,
    stats: {
      averageRating: 4.9,
      reviewCount: 2,
    },
    menu: [
      { name: "돈코츠라멘", price: 9000 },
      { name: "미소라멘", price: 8500 },
      { name: "차슈덮밥", price: 7000 },
      { name: "교자", price: 5000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439018",
    name: "타코 플라자",
    type: "OFF_CAMPUS",
    category: "멕시칸",
    address: "서울특별시 마포구 백범로 8",
    location: {
      type: "Point",
      coordinates: [126.976, 37.569],
    },
    imageUrl: "https://example.com/taco.jpg",
    isActive: true,
    stats: {
      averageRating: 4.3,
      reviewCount: 1,
    },
    menu: [
      { name: "비프타코", price: 8000 },
      { name: "치킨타코", price: 7500 },
      { name: "부리또", price: 9000 },
      { name: "나초", price: 6000 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439019",
    name: "카페베이커리 샌드",
    type: "OFF_CAMPUS",
    category: "카페",
    address: "서울특별시 마포구 백범로 9",
    location: {
      type: "Point",
      coordinates: [126.983, 37.561],
    },
    imageUrl: "https://example.com/cafe.jpg",
    isActive: true,
    stats: {
      averageRating: 4.5,
      reviewCount: 2,
    },
    menu: [
      { name: "아메리카노", price: 4500 },
      { name: "카페라떼", price: 5000 },
      { name: "크로와상", price: 3500 },
      { name: "샌드위치", price: 6500 },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
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
      menuItems: "참치김밥",
    },
    ratings: {
      menuRatings: [{ menuName: "참치김밥", rating: 5 }],
      restaurantRating: 4,
    },
    content: "김밥이 정말 맛있어요! 참치가 많이 들어있습니다.",
    likeCount: 15,
    createdAt: "2025-01-05T10:30:00Z",
    updatedAt: "2025-01-05T10:30:00Z",
  },
  {
    _id: "507f191e810c19729de860eb",
    userId: "507f191e810c19729de860e2",
    nickname: "이영희",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439011",
      restaurantName: "맛있는 김밥",
      menuItems: "돈까스",
    },
    ratings: {
      menuRatings: [{ menuName: "돈까스", rating: 5 }],
      restaurantRating: 5,
    },
    content: "가성비 최고! 양도 푸짐해요.",
    imageUrl: "https://example.com/photo1.jpg",
    likeCount: 23,
    createdAt: "2025-01-04T14:20:00Z",
    updatedAt: "2025-01-04T14:20:00Z",
  },
  {
    _id: "507f191e810c19729de860ec",
    userId: "507f191e810c19729de860e3",
    nickname: "박민수",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439012",
      restaurantName: "행복한 돈까스",
      menuItems: "등심돈까스",
    },
    ratings: {
      menuRatings: [{ menuName: "등심돈까스", rating: 5 }],
      restaurantRating: 4,
    },
    content: "돈까스가 바삭하고 소스가 맛있어요.",
    likeCount: 30,
    createdAt: "2025-01-03T12:15:00Z",
    updatedAt: "2025-01-03T12:15:00Z",
  },
  {
    _id: "507f191e810c19729de860ed",
    userId: "507f191e810c19729de860e4",
    nickname: "최지훈",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439013",
      restaurantName: "정통 한식당",
      menuItems: "김치찌개",
    },
    ratings: {
      menuRatings: [{ menuName: "김치찌개", rating: 4 }],
      restaurantRating: 4,
    },
    content: "집밥 같은 맛이에요. 반찬도 잘 나옵니다.",
    likeCount: 18,
    createdAt: "2025-01-02T11:45:00Z",
    updatedAt: "2025-01-02T11:45:00Z",
  },
  {
    _id: "507f191e810c19729de860ee",
    userId: "507f191e810c19729de860e5",
    nickname: "정수진",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439014",
      restaurantName: "파스타 하우스",
      menuItems: "까르보나라",
    },
    ratings: {
      menuRatings: [{ menuName: "까르보나라", rating: 5 }],
      restaurantRating: 4,
    },
    content: "파스타 면발이 쫄깃하고 크림소스가 진해요.",
    imageUrl: "https://example.com/photo2.jpg",
    likeCount: 25,
    createdAt: "2025-01-01T19:30:00Z",
    updatedAt: "2025-01-01T19:30:00Z",
  },
  {
    _id: "507f191e810c19729de860ef",
    userId: "507f191e810c19729de860e6",
    nickname: "강민지",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439015",
      restaurantName: "중화요리 만리장성",
      menuItems: "짬뽕",
    },
    ratings: {
      menuRatings: [{ menuName: "짬뽕", rating: 4 }],
      restaurantRating: 4,
    },
    content: "국물이 얼큰하고 해물이 신선해요. 양도 많아요!",
    likeCount: 12,
    createdAt: "2025-01-06T13:20:00Z",
    updatedAt: "2025-01-06T13:20:00Z",
  },
  {
    _id: "507f191e810c19729de860f0",
    userId: "507f191e810c19729de860e7",
    nickname: "윤성호",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439015",
      restaurantName: "중화요리 만리장성",
      menuItems: "탕수육",
    },
    ratings: {
      menuRatings: [{ menuName: "탕수육", rating: 5 }],
      restaurantRating: 5,
    },
    content: "탕수육 바삭하고 소스가 맛있습니다. 단골 될 것 같아요.",
    imageUrl: "https://example.com/photo3.jpg",
    likeCount: 20,
    createdAt: "2025-01-07T18:45:00Z",
    updatedAt: "2025-01-07T18:45:00Z",
  },
  {
    _id: "507f191e810c19729de860f1",
    userId: "507f191e810c19729de860e8",
    nickname: "배지영",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439016",
      restaurantName: "치킨왕국",
      menuItems: "양념치킨",
    },
    ratings: {
      menuRatings: [{ menuName: "양념치킨", rating: 5 }],
      restaurantRating: 5,
    },
    content: "양념이 달콤하면서 매콤해요. 최고의 치킨!",
    likeCount: 28,
    createdAt: "2025-01-06T20:15:00Z",
    updatedAt: "2025-01-06T20:15:00Z",
  },
  {
    _id: "507f191e810c19729de860f2",
    userId: "507f191e810c19729de860e9",
    nickname: "임준혁",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439016",
      restaurantName: "치킨왕국",
      menuItems: "후라이드치킨",
    },
    ratings: {
      menuRatings: [{ menuName: "후라이드치킨", rating: 4 }],
      restaurantRating: 4,
    },
    content: "바삭함이 오래 유지돼요. 맥주 안주로 최고!",
    imageUrl: "https://example.com/photo4.jpg",
    likeCount: 16,
    createdAt: "2025-01-05T21:30:00Z",
    updatedAt: "2025-01-05T21:30:00Z",
  },
  {
    _id: "507f191e810c19729de860f3",
    userId: "507f191e810c19729de860ea",
    nickname: "송하늘",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439017",
      restaurantName: "라멘 가게 혼",
      menuItems: "돈코츠라멘",
    },
    ratings: {
      menuRatings: [{ menuName: "돈코츠라멘", rating: 5 }],
      restaurantRating: 5,
    },
    content: "진한 국물이 일본에서 먹던 맛 그대로예요. 면발도 완벽!",
    imageUrl: "https://example.com/photo5.jpg",
    likeCount: 35,
    createdAt: "2025-01-08T12:00:00Z",
    updatedAt: "2025-01-08T12:00:00Z",
  },
  {
    _id: "507f191e810c19729de860f4",
    userId: "507f191e810c19729de860eb",
    nickname: "한서준",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439017",
      restaurantName: "라멘 가게 혼",
      menuItems: "차슈덮밥",
    },
    ratings: {
      menuRatings: [{ menuName: "차슈덮밥", rating: 5 }],
      restaurantRating: 5,
    },
    content: "차슈가 입에서 녹아요. 가격 대비 양도 푸짐합니다.",
    likeCount: 22,
    createdAt: "2025-01-07T13:45:00Z",
    updatedAt: "2025-01-07T13:45:00Z",
  },
  {
    _id: "507f191e810c19729de860f5",
    userId: "507f191e810c19729de860ec",
    nickname: "오지훈",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439018",
      restaurantName: "타코 플라자",
      menuItems: "부리또",
    },
    ratings: {
      menuRatings: [{ menuName: "부리또", rating: 4 }],
      restaurantRating: 4,
    },
    content: "재료가 신선하고 양이 많아요. 배부르게 먹었습니다.",
    likeCount: 14,
    createdAt: "2025-01-08T17:25:00Z",
    updatedAt: "2025-01-08T17:25:00Z",
  },
  {
    _id: "507f191e810c19729de860f6",
    userId: "507f191e810c19729de860ed",
    nickname: "권민서",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439019",
      restaurantName: "카페베이커리 샌드",
      menuItems: "샌드위치",
    },
    ratings: {
      menuRatings: [{ menuName: "샌드위치", rating: 5 }],
      restaurantRating: 5,
    },
    content: "빵이 신선하고 샌드위치 재료가 푸짐해요. 커피도 맛있어요!",
    imageUrl: "https://example.com/photo6.jpg",
    likeCount: 19,
    createdAt: "2025-01-08T09:30:00Z",
    updatedAt: "2025-01-08T09:30:00Z",
  },
  {
    _id: "507f191e810c19729de860f7",
    userId: "507f191e810c19729de860ee",
    nickname: "조은비",
    target: {
      type: "RESTAURANT",
      restaurantId: "507f1f77bcf86cd799439019",
      restaurantName: "카페베이커리 샌드",
      menuItems: "크로와상",
    },
    ratings: {
      menuRatings: [{ menuName: "크로와상", rating: 4 }],
      restaurantRating: 4,
    },
    content: "갓 구운 크로와상이 바삭해요. 아메리카노랑 잘 어울립니다.",
    likeCount: 11,
    createdAt: "2025-01-07T10:20:00Z",
    updatedAt: "2025-01-07T10:20:00Z",
  },
];

// 식당의 평균 별점 계산 헬퍼 함수 (가게 별점 평균)
export function getAverageRating(restaurantId: string): number {
  const restaurantReviews = reviewsData.filter(
    (review) => review.target.restaurantId === restaurantId
  );

  if (restaurantReviews.length === 0) return 0;

  const totalRating = restaurantReviews.reduce(
    (sum, review) => sum + review.ratings.restaurantRating,
    0
  );

  return totalRating / restaurantReviews.length;
}

// 식당의 리뷰 개수 가져오기
export function getReviewCount(restaurantId: string): number {
  return reviewsData.filter(
    (review) => review.target.restaurantId === restaurantId
  ).length;
}

// 리뷰 추가 함수
export function addReview(
  reviewData: Partial<Review>,
  userId?: string,
  nickname?: string
): Review {
  const newReview: Review = {
    _id: `review_${Date.now()}`, // 임시 ID 생성 (실제로는 백엔드에서 생성)
    userId: userId || reviewData.userId || "temp_user_id", // 로그인한 사용자 ID
    nickname: nickname || reviewData.nickname || "익명", // 로그인한 사용자 닉네임
    target: reviewData.target!,
    ratings: reviewData.ratings!,
    content: reviewData.content!,
    imageUrl: reviewData.imageUrl,
    imageUrls: reviewData.imageUrls || [],
    likeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  reviewsData.push(newReview);
  return newReview;
}

// 리뷰 수정 함수
export function updateReview(
  reviewId: string,
  reviewData: Partial<Review>
): Review | null {
  const index = reviewsData.findIndex((review) => review._id === reviewId);
  if (index === -1) return null;

  reviewsData[index] = {
    ...reviewsData[index],
    ...reviewData,
    updatedAt: new Date().toISOString(),
  };

  return reviewsData[index];
}

// 리뷰 삭제 함수
export function deleteReview(reviewId: string): boolean {
  const index = reviewsData.findIndex((review) => review._id === reviewId);
  if (index === -1) return false;

  reviewsData.splice(index, 1);
  return true;
}

// 리뷰 좋아요 토글 함수
export function toggleReviewLike(reviewId: string, userId: string): boolean {
  const index = reviewsData.findIndex((review) => review._id === reviewId);
  if (index === -1) return false;

  // likes 컬렉션에서 토글
  const isNowLiked = toggleLike(userId, reviewId);

  // likeCount 업데이트 (캐시 동기화)
  if (isNowLiked) {
    reviewsData[index].likeCount += 1;
  } else {
    reviewsData[index].likeCount = Math.max(
      0,
      reviewsData[index].likeCount - 1
    );
  }

  return true;
}

// 사용자가 특정 리뷰에 좋아요를 눌렀는지 확인
export function isReviewLiked(reviewId: string, userId: string): boolean {
  return hasUserLikedReview(userId, reviewId);
}
