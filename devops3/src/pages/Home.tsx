import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Restaurant } from "../data/places";
import type { ReviewResponse, OnCampusMenuResponse } from "../api/types";
import { getAllReviews } from "../api/reviews";
import { getOnCampusMenus } from "../api/menus";
import Roulette from "../components/Roulette";
import RestaurantDetail from "../components/RestaurantDetail";
import "../App.css";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [latestReviews, setLatestReviews] = useState<ReviewResponse[]>([]);
  const [campusMenus, setCampusMenus] = useState<OnCampusMenuResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // 최신 리뷰 가져오기
  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        const reviews = await getAllReviews();
        // 날짜순 정렬 후 최신 5개
        const sorted = [...reviews]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);
        setLatestReviews(sorted);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReviews();
  }, []);

  // 교내 메뉴 가져오기
  useEffect(() => {
    const fetchCampusMenus = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const menus = await getOnCampusMenus(today);
        setCampusMenus(menus);
      } catch (error) {
        console.error("Failed to fetch campus menus:", error);
      }
    };

    fetchCampusMenus();
  }, []);

  const getAverageRating = (ratings: ReviewResponse["ratings"]) => {
    // 가게 별점을 표시
    if (ratings?.restaurantRating !== undefined && ratings?.restaurantRating !== null) {
      return ratings.restaurantRating.toFixed(1);
    }
    return "0.0"; // 기본값
  };

  const handleReviewClick = (restaurantId: string) => {
    navigate(`/map?restaurantId=${restaurantId}`);
  };

  return (
    <div className="home-container">
      <div className="home-grid">
        {/* 최신 리뷰 컨테이너 */}
        <div className="section-container latest-reviews-section">
          <h2 className="section-title">최신 리뷰</h2>
          <div className="reviews-list">
            {loading ? (
              <p>로딩 중...</p>
            ) : latestReviews.length === 0 ? (
              <p>아직 리뷰가 없습니다.</p>
            ) : (
              latestReviews.map((review) => (
              <div
                key={review._id}
                className="review-card"
                onClick={() => review.restaurantId && handleReviewClick(review.restaurantId)}
                style={{ cursor: review.restaurantId ? "pointer" : "default" }}
              >
                <div className="review-header">
                  <div>
                    <span className="restaurant-name">
                      {review.restaurantName || "식당 정보 없음"}
                    </span>
                    {review.ratings.menuRatings.length > 0 && (
                      <span className="menu-items">
                        ({review.ratings.menuRatings.map(m => m.menuName).join(", ")})
                      </span>
                    )}
                  </div>
                  <span className="rating">
                    ⭐ {getAverageRating(review.ratings)}
                  </span>
                </div>
                <p className="review-content">{review.content}</p>
                <div className="review-footer">
                  <span>{review.nickname}</span>
                  <span>👍 {review.likeCount}</span>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* 룰렛 컨테이너 */}
        <div className="section-container roulette-section">
          <h2 className="section-title">🎰오늘의 식당</h2>
          <Roulette onNavigateToMap={handleReviewClick} />
        </div>

        {/* 오늘의 우정원 메뉴 컨테이너 */}
        <div className="section-container sogang-menu-section">
          <h2 className="section-title">오늘의 우정원 메뉴</h2>
          <div className="menu-placeholder">
            {campusMenus && campusMenus.menus && campusMenus.menus.length > 0 ? (
              <div>
                {campusMenus.menus.map((menu, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <strong>{menu.restaurantName}</strong>
                    <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                      {menu.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p>메뉴 정보를 준비 중입니다...</p>
                <p className="menu-placeholder-subtext">
                  데이터 양식이 정리되면 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 선택된 식당 상세 정보 모달 */}
      {selectedRestaurant && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedRestaurant(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RestaurantDetail
              restaurant={selectedRestaurant}
              onClose={() => setSelectedRestaurant(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
