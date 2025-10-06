// 식당 데이터 구조
export interface Restaurant {
  idx: number;
  name: string;
  lat: number;
  lng: number;
  menu: { [menuName: string]: number }; // 메뉴명: 가격
}

// 리뷰 데이터 구조
export interface Review {
  idx: number;
  restaurantIdx: number;
  rating: number;
  content: string;
  photo?: string; // optional
  likes: number;
  dislikes: number;
  menuTag?: string; // optional
  createdAt: string;
  author: string;
}

// 목 데이터 - 식당 (나중에 백엔드에서 가져올 예정)
export const restaurantsData: Restaurant[] = [
  {
    idx: 1,
    name: "맛있는 김밥",
    lat: 37.5665,
    lng: 126.9780,
    menu: {
      "참치김밥": 3000,
      "치즈김밥": 3500,
      "김치김밥": 3000,
      "돈까스": 6000
    }
  },
  {
    idx: 2,
    name: "행복한 돈까스",
    lat: 37.5700,
    lng: 126.9800,
    menu: {
      "등심돈까스": 8000,
      "치즈돈까스": 9000,
      "생선까스": 8500
    }
  },
  {
    idx: 3,
    name: "정통 한식당",
    lat: 37.5650,
    lng: 126.9750,
    menu: {
      "김치찌개": 7000,
      "된장찌개": 7000,
      "제육볶음": 8000,
      "불고기": 9000
    }
  },
  {
    idx: 4,
    name: "파스타 하우스",
    lat: 37.5630,
    lng: 126.9820,
    menu: {
      "까르보나라": 12000,
      "토마토파스타": 11000,
      "알리오올리오": 10000,
      "크림파스타": 12000
    }
  }
];

// 목 데이터 - 리뷰 (나중에 백엔드에서 가져올 예정)
export const reviewsData: Review[] = [
  {
    idx: 1,
    restaurantIdx: 1,
    rating: 4.5,
    content: "김밥이 정말 맛있어요! 참치가 많이 들어있습니다.",
    likes: 15,
    dislikes: 2,
    menuTag: "참치김밥",
    createdAt: "2025-01-05T10:30:00",
    author: "김철수"
  },
  {
    idx: 2,
    restaurantIdx: 1,
    rating: 5.0,
    content: "가성비 최고! 양도 푸짐해요.",
    photo: "https://example.com/photo1.jpg",
    likes: 23,
    dislikes: 1,
    menuTag: "돈까스",
    createdAt: "2025-01-04T14:20:00",
    author: "이영희"
  },
  {
    idx: 3,
    restaurantIdx: 2,
    rating: 4.8,
    content: "돈까스가 바삭하고 소스가 맛있어요.",
    likes: 30,
    dislikes: 3,
    menuTag: "등심돈까스",
    createdAt: "2025-01-03T12:15:00",
    author: "박민수"
  },
  {
    idx: 4,
    restaurantIdx: 3,
    rating: 4.2,
    content: "집밥 같은 맛이에요. 반찬도 잘 나옵니다.",
    likes: 18,
    dislikes: 4,
    menuTag: "김치찌개",
    createdAt: "2025-01-02T11:45:00",
    author: "최지훈"
  },
  {
    idx: 5,
    restaurantIdx: 4,
    rating: 4.7,
    content: "파스타 면발이 쫄깃하고 크림소스가 진해요.",
    photo: "https://example.com/photo2.jpg",
    likes: 25,
    dislikes: 2,
    menuTag: "까르보나라",
    createdAt: "2025-01-01T19:30:00",
    author: "정수진"
  }
];

// 식당의 평균 별점 계산 헬퍼 함수
export function getAverageRating(restaurantIdx: number): number {
  const restaurantReviews = reviewsData.filter(
    review => review.restaurantIdx === restaurantIdx
  );

  if (restaurantReviews.length === 0) return 0;

  const totalRating = restaurantReviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  return totalRating / restaurantReviews.length;
}

// 식당의 리뷰 개수 가져오기
export function getReviewCount(restaurantIdx: number): number {
  return reviewsData.filter(
    review => review.restaurantIdx === restaurantIdx
  ).length;
}
