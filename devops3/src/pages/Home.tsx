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
  const [restaurantMenuMap, setRestaurantMenuMap] = useState<
    Record<string, Array<{ id?: string | null; _id?: string; name: string; price: number }>>
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

        const nameMap: Record<string, string> = {};
        const menuMap: Record<string, Array<{ id?: string | null; _id?: string; name: string; price: number }>> = {};
        await Promise.all(
          ids.map(async (id) => {
            try {
              const detail = await getRestaurant(id);
              nameMap[id] = detail.name; // 최신 이름
              menuMap[id] = detail.menu;
            } catch (e) {
              console.warn("식당 정보 갱신 실패:", id, e);
            }
          })
        );
        setRestaurantNameMap(nameMap);
        setRestaurantMenuMap(menuMap);
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
        // 에러 발생 시 (404 등) 빈 상태로 유지
      }
    };

    fetchCampusMenus();
  }, []);

  const getAverageRating = (
    ratings: ReviewResponse["ratings"],
    restaurantId?: string
  ) => {
    // MAIN_CAMPUS인 경우 메뉴 별점의 평균을 표시
    if (restaurantId === "MAIN_CAMPUS" && ratings?.menuRatings) {
      const menuRatings = ratings.menuRatings;
      if (menuRatings.length > 0) {
        const sum = menuRatings.reduce(
          (acc, menu) => acc + (menu.rating || 0),
          0
        );
        const avg = sum / menuRatings.length;
        return avg.toFixed(1);
      }
    }

    // 가게 별점을 표시
    if (
      ratings?.restaurantRating !== undefined &&
      ratings?.restaurantRating !== null
    ) {
      return ratings.restaurantRating.toFixed(1);
    }
    return "0.0"; // 기본값
  };

  const handleReviewClick = (
    restaurantId: string,
    review?: ReviewResponse
  ) => {
    // MAIN_CAMPUS인 경우 첫 번째 메뉴의 리뷰 모달 띄우기
    if (restaurantId === "MAIN_CAMPUS" && review) {
      const ratings = (review as any).rating || review.ratings;
      const firstMenu = ratings?.menuRatings?.[0];
      if (firstMenu) {
        const menuName =
          getMenuNameById(firstMenu.menuId) ||
          firstMenu.menuName ||
          "메뉴 정보 없음";
        handleMenuClick(firstMenu.menuId, menuName);
        return;
      }
    }
    // 일반 식당인 경우 지도로 이동
    navigate(`/map?restaurantId=${restaurantId}`);
  };

  const handleMenuClick = (menuId: string, menuName: string) => {
    setSelectedMenu({ id: menuId, name: menuName });
  };

  // menuId로 campusMenus에서 메뉴 이름 찾기 (MAIN_CAMPUS용)
  const getMenuNameById = (menuId: string): string | null => {
    if (!campusMenus?.dailyMenus) return null;

    for (const dailyMenu of campusMenus.dailyMenus) {
      for (const meal of dailyMenu.meals) {
        for (const item of meal.items) {
          if (
            typeof item === "object" &&
            (item._id === menuId || item.id === menuId)
          ) {
            return item.name;
          }
        }
      }
    }
    return null;
  };

  // menuId와 restaurantId로 메뉴 이름 찾기 (OFF_CAMPUS용)
  const getOffCampusMenuName = (restaurantId: string, menuId: string): string | null => {
    const menus = restaurantMenuMap[restaurantId];
    if (!menus) return null;

    const menu = menus.find(m => m.id === menuId || m._id === menuId);
    return menu?.name || null;
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
              latestReviews.map((review) => {
                const isMainCampus = review.restaurantId === "MAIN_CAMPUS";
                const isClickable = review.restaurantId !== undefined;
                return (
                  <div
                    key={review._id}
                    className="review-card"
                    onClick={() => {
                      if (isClickable) {
                        handleReviewClick(review.restaurantId!, review);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === "Enter" || e.key === " ")) {
                        handleReviewClick(review.restaurantId!, review);
                      }
                    }}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    style={{
                      cursor: isClickable ? "pointer" : "default",
                    }}
                  >
                    <div className="review-header">
                      <div>
                        <span className="restaurant-name">
                          {isMainCampus
                            ? "우정원"
                            : (review.restaurantId &&
                                restaurantNameMap[review.restaurantId]) ||
                              review.restaurantName ||
                              "식당 정보 없음"}
                        </span>
                        {(() => {
                          const ratings = (review as any).rating || review.ratings;
                          return ratings?.menuRatings && ratings.menuRatings.length > 0 ? (
                            <span className="menu-items">
                              (
                              {isMainCampus
                                ? ratings.menuRatings
                                    .map(
                                      (m: any) =>
                                        getMenuNameById(m.menuId) ||
                                        m.menuName ||
                                        "메뉴 정보 없음"
                                    )
                                    .join(", ")
                                : ratings.menuRatings
                                    .map((m: any) => {
                                      const restaurantId = review.restaurantId;
                                      return (
                                        (restaurantId && getOffCampusMenuName(restaurantId, m.menuId)) ||
                                        m.menuName ||
                                        "메뉴 정보 없음"
                                      );
                                    })
                                    .join(", ")}
                              )
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <span className="rating">
                        ⭐{" "}
                        {getAverageRating((review as any).rating || review.ratings, review.restaurantId)}
                      </span>
                    </div>
                    <p className="review-content">{review.content}</p>
                    <div className="review-footer">
                      <span>{review.nickname}</span>
                      <span>👍 {review.likeCount}</span>
                    </div>
                  </div>
                );
              })
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
                {(() => {
                  const today = new Date().toISOString().split("T")[0];
                  const todayDate = new Date();

                  // 오늘 날짜의 메뉴를 먼저 찾습니다
                  let targetMenus = campusMenus.dailyMenus.filter(
                    (dailyMenu) => dailyMenu.date === today
                  );

                  // 메뉴가 없으면 다음 7일 안에서 가장 가까운 메뉴를 찾습니다
                  if (targetMenus.length === 0) {
                    for (let i = 1; i <= 7; i++) {
                      const nextDay = new Date(todayDate);
                      nextDay.setDate(todayDate.getDate() + i);
                      const nextDayStr = nextDay.toISOString().split("T")[0];

                      targetMenus = campusMenus.dailyMenus.filter(
                        (dailyMenu) => dailyMenu.date === nextDayStr
                      );

                      if (targetMenus.length > 0) {
                        break;
                      }
                    }
                  }

                  return targetMenus.map((dailyMenu, index) => (
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
                                  typeof item === "string" ? null : item.id;

                                // id가 없으면 클릭 불가
                                const isClickable =
                                  menuId !== null && menuId !== undefined;

                                return (
                                  <li
                                    key={itemIdx}
                                    className={`menu-item ${
                                      isClickable ? "clickable" : "disabled"
                                    }`}
                                    onClick={() => {
                                      if (isClickable) {
                                        handleMenuClick(menuId, menuName);
                                      } else {
                                        alert(
                                          "이 메뉴는 아직 리뷰를 작성할 수 없습니다.\nDB에 메뉴 ID가 설정되지 않았습니다."
                                        );
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (
                                        (e.key === "Enter" || e.key === " ") &&
                                        isClickable
                                      ) {
                                        handleMenuClick(menuId, menuName);
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    title={
                                      isClickable
                                        ? "클릭하여 리뷰 작성"
                                        : "메뉴 ID가 설정되지 않음"
                                    }
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
                  ));
                })()}
                {(() => {
                  const today = new Date().toISOString().split("T")[0];
                  const todayDate = new Date();

                  let targetMenus = campusMenus.dailyMenus.filter(
                    (dailyMenu) => dailyMenu.date === today
                  );

                  if (targetMenus.length === 0) {
                    for (let i = 1; i <= 7; i++) {
                      const nextDay = new Date(todayDate);
                      nextDay.setDate(todayDate.getDate() + i);
                      const nextDayStr = nextDay.toISOString().split("T")[0];

                      targetMenus = campusMenus.dailyMenus.filter(
                        (dailyMenu) => dailyMenu.date === nextDayStr
                      );

                      if (targetMenus.length > 0) {
                        break;
                      }
                    }
                  }

                  return targetMenus.length === 0 ? (
                    <div className="menu-empty">
                      <p>📅 메뉴 정보가 없습니다.</p>
                      <p className="menu-empty-subtext">
                        다음 7일 안에 메뉴가 없습니다. 잠시 후 다시 시도해주세요.
                      </p>
                    </div>
                  ) : null;
                })()}
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
