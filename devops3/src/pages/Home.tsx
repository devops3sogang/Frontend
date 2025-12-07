import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Restaurant } from "../data/places";
import type { ReviewResponse, OnCampusMenuResponse } from "../api/types";
import { getAllReviews } from "../api/reviews";
import { getOnCampusMenus } from "../api/menus";
import { getRestaurant } from "../api";
import Roulette from "../components/Roulette";
import RestaurantDetail from "../components/RestaurantDetail";
import MenuReviewModal from "../components/MenuReviewModal";
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
  const [restaurantNameMap, setRestaurantNameMap] = useState<
    Record<string, string>
  >({});
  const [selectedMenu, setSelectedMenu] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

        // ✅ 리뷰의 restaurantId로 최신 식당 이름을 매핑
        const ids = Array.from(
          new Set(
            sorted
              .map((r) => r.restaurantId) // 하위 호환 필드 사용 (이미 코드가 이걸 씀)
              .filter((id): id is string => !!id)
          )
        );

        const map: Record<string, string> = {};
        await Promise.all(
          ids.map(async (id) => {
            try {
              const detail = await getRestaurant(id);
              map[id] = detail.name; // 최신 이름
            } catch (e) {
              console.warn("식당 이름 갱신 실패:", id, e);
            }
          })
        );
        setRestaurantNameMap(map);
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
        // const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD (원래 코드)
        const today = "2025-12-05"; // 디버그용 고정 날짜
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
    if (
      ratings?.restaurantRating !== undefined &&
      ratings?.restaurantRating !== null
    ) {
      return ratings.restaurantRating.toFixed(1);
    }
    return "0.0"; // 기본값
  };

  const handleReviewClick = (restaurantId: string) => {
    navigate(`/map?restaurantId=${restaurantId}`);
  };

  const handleMenuClick = (menuId: string, menuName: string) => {
    setSelectedMenu({ id: menuId, name: menuName });
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
                  onClick={() =>
                    review.restaurantId &&
                    handleReviewClick(review.restaurantId)
                  }
                  style={{
                    cursor: review.restaurantId ? "pointer" : "default",
                  }}
                >
                  <div className="review-header">
                    <div>
                      <span className="restaurant-name">
                        {
                          // ✅ 최신 이름이 있으면 그걸 사용, 없으면 기존 필드 사용
                          (review.restaurantId &&
                            restaurantNameMap[review.restaurantId]) ||
                            review.restaurantName ||
                            "식당 정보 없음"
                        }
                      </span>
                      {review.ratings?.menuRatings &&
                        review.ratings.menuRatings.length > 0 && (
                          <span className="menu-items">
                            (
                            {review.ratings.menuRatings
                              .map((m) => m.menuName)
                              .join(", ")}
                            )
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
          <h2 className="section-title">🎰오늘의 맛집</h2>
          <Roulette onNavigateToMap={handleReviewClick} />
        </div>

        {/* 오늘의 우정원 메뉴 컨테이너 */}
        <div className="section-container sogang-menu-section">
          <h2 className="section-title">🍽️ 오늘의 우정원 메뉴</h2>
          <div className="menu-content">
            {campusMenus &&
            campusMenus.dailyMenus &&
            campusMenus.dailyMenus.length > 0 ? (
              <>
                {campusMenus.dailyMenus
                  .filter((dailyMenu) => {
                    // const today = new Date().toISOString().split("T")[0];
                    const today = "2025-12-05"; // 디버그용
                    return dailyMenu.date === today;
                  })
                  .map((dailyMenu, index) => (
                    <div key={index} className="menu-daily-container">
                      <div className="menu-date-header">
                        <span className="menu-date">{dailyMenu.date}</span>
                        <span className="menu-day">{dailyMenu.dayOfWeek}</span>
                      </div>
                      <div className="menu-meals-grid">
                        {dailyMenu.meals.map((meal, idx) => (
                          <div key={idx} className="menu-meal-card">
                            <div className="menu-category-badge">
                              {meal.category}
                            </div>
                            <ul className="menu-items-list">
                              {meal.items.map((item, itemIdx) => {
                                const menuName =
                                  typeof item === "string" ? item : item.name;
                                const menuId =
                                  typeof item === "string"
                                    ? null
                                    : item.id;

                                // id가 없으면 클릭 불가
                                const isClickable = menuId !== null && menuId !== undefined;

                                return (
                                  <li
                                    key={itemIdx}
                                    className={`menu-item ${isClickable ? "clickable" : "disabled"}`}
                                    onClick={() => {
                                      if (isClickable) {
                                        handleMenuClick(menuId, menuName);
                                      } else {
                                        alert("이 메뉴는 아직 리뷰를 작성할 수 없습니다.\nDB에 메뉴 ID가 설정되지 않았습니다.");
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === " ") && isClickable) {
                                        handleMenuClick(menuId, menuName);
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    title={isClickable ? "클릭하여 리뷰 작성" : "메뉴 ID가 설정되지 않음"}
                                  >
                                    {menuName} {!isClickable && " ⚠️"}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {campusMenus.dailyMenus.filter(
                  (dm) => dm.date === new Date().toISOString().split("T")[0]
                ).length === 0 && (
                  <div className="menu-empty">
                    <p>📅 오늘 날짜의 메뉴가 없습니다.</p>
                    <p className="menu-empty-subtext">
                      주말이거나 공휴일일 수 있습니다.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="menu-loading">
                <p>⏳ 메뉴 정보를 불러오는 중...</p>
                <p className="menu-loading-subtext">잠시만 기다려 주세요.</p>
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

      {/* 메뉴 리뷰 모달 */}
      {selectedMenu && campusMenus && (
        <MenuReviewModal
          restaurantId={campusMenus.restaurantId}
          menuId={selectedMenu.id}
          menuName={selectedMenu.name}
          onClose={() => setSelectedMenu(null)}
        />
      )}
    </div>
  );
}

export default Home;
