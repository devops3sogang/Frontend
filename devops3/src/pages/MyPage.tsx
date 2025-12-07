// 마이페이지

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { ReviewResponse, OnCampusMenuResponse } from "../api/types";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "../api/users";
import { getRestaurant } from "../api";
import { getOnCampusMenus } from "../api/menus";
import MenuReviewModal from "../components/MenuReviewModal";
import "./MyPage.css";

function MyPage() {
  const { user, logout, updateNickname, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [myReviews, setMyReviews] = useState<ReviewResponse[]>([]);
  const [likedReviews, setLikedReviews] = useState<ReviewResponse[]>([]);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [restaurantNameMap, setRestaurantNameMap] = useState<
    Record<string, string>
  >({});
  const [restaurantMenuMap, setRestaurantMenuMap] = useState<
    Record<string, Array<{ id?: string | null; _id?: string; name: string; price: number }>>
  >({});
  const [campusMenus, setCampusMenus] = useState<OnCampusMenuResponse | null>(
    null
  );
  const [selectedMenu, setSelectedMenu] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user) {
      setNickname(user.nickname);

      // 내가 작성한 리뷰와 좋아요한 리뷰 가져오기
      const fetchUserProfile = async () => {
        try {
          const data = await getMyProfile();
          console.log("Fetched profile data:", data);
          const myReviewsData = data.myReviews || [];
          const likedReviewsData = data.likedReviews || [];
          setMyReviews(myReviewsData);
          setLikedReviews(likedReviewsData);

          // 모든 리뷰에서 식당 ID 수집 (target.restaurantId 사용)
          const allReviews = [...myReviewsData, ...likedReviewsData];
          const restaurantIds = Array.from(
            new Set(
              allReviews
                .map((r) => r.target?.restaurantId)
                .filter((id): id is string => !!id && id !== "MAIN_CAMPUS")
            )
          );

          // 식당 이름과 메뉴 정보 가져오기
          const nameMap: Record<string, string> = {};
          const menuMap: Record<string, Array<{ id?: string | null; _id?: string; name: string; price: number }>> = {};
          await Promise.all(
            restaurantIds.map(async (id) => {
              try {
                const detail = await getRestaurant(id);
                nameMap[id] = detail.name;
                menuMap[id] = detail.menu;
              } catch (e) {
                console.warn("식당 정보 갱신 실패:", id, e);
              }
            })
          );
          setRestaurantNameMap(nameMap);
          setRestaurantMenuMap(menuMap);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setMyReviews([]);
          setLikedReviews([]);
        }
      };

      fetchUserProfile();
    }
  }, [user?.nickname, isAuthenticated, navigate]);

  // 교내 메뉴 가져오기
  useEffect(() => {
    const fetchCampusMenus = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const menus = await getOnCampusMenus(today);
        setCampusMenus(menus);
      } catch (error) {
        console.error("Failed to fetch campus menus:", error);
      }
    };

    fetchCampusMenus();
  }, []);

  const handleNicknameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!user) return;

    if (nickname.trim().length < 2) {
      setError("닉네임은 2자 이상이어야 합니다.");
      return;
    }

    try {
      await updateNickname(nickname);
      setMessage("닉네임이 성공적으로 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update nickname:", error);
      setError("닉네임 변경에 실패했습니다.");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!user) return;

    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await updateMyProfile({
        currentPassword,
        password: newPassword,
      });
      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to update password:", error);
      setError("현재 비밀번호가 올바르지 않거나 비밀번호 변경에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!deletePassword) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    const confirmed = window.confirm(
      "정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMyAccount({ password: deletePassword });
      alert("회원 탈퇴가 완료되었습니다.");
      logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setError("비밀번호가 올바르지 않거나 회원 탈퇴에 실패했습니다.");
      setDeletePassword("");
    }
  };

  const handleReviewClick = (review: ReviewResponse) => {
    console.log("Review clicked:", review);
    console.log("restaurantId:", review.restaurantId);
    console.log("target:", review.target);

    const restaurantId = review.restaurantId || review.target?.restaurantId;

    // MAIN_CAMPUS인 경우 첫 번째 메뉴의 리뷰 모달 띄우기
    if (restaurantId === "MAIN_CAMPUS") {
      const ratings = (review as any).rating || review.ratings;
      const firstMenu = ratings?.menuRatings?.[0];
      if (firstMenu) {
        const menuName =
          getMenuNameById(firstMenu.menuId) ||
          firstMenu.menuName ||
          "메뉴 정보 없음";
        handleMenuClick(firstMenu.menuId, menuName);
      }
      return; // menuRatings가 없어도 map으로 이동하지 않음
    }

    // 일반 식당인 경우 지도로 이동
    if (restaurantId) {
      console.log("Navigating to:", `/map?restaurantId=${restaurantId}`);
      navigate(`/map?restaurantId=${restaurantId}`);
    } else {
      console.warn("No restaurantId found in review:", review);
    }
  };

  const handleMenuClick = (menuId: string, menuName: string) => {
    setSelectedMenu({ id: menuId, name: menuName });
  };

  // 별점 계산 (MAIN_CAMPUS인 경우 메뉴 별점 평균)
  const getAverageRating = (review: ReviewResponse) => {
    const ratings = (review as any).rating || review.ratings;
    const restaurantId = review.restaurantId || review.target?.restaurantId;

    // MAIN_CAMPUS인 경우 메뉴 별점의 평균을 표시
    if (restaurantId === "MAIN_CAMPUS" && ratings?.menuRatings) {
      const menuRatings = ratings.menuRatings;
      if (menuRatings.length > 0) {
        const sum = menuRatings.reduce(
          (acc: number, menu: any) => acc + (menu.rating || 0),
          0
        );
        const avg = sum / menuRatings.length;
        return avg.toFixed(1);
      }
    }

    // 일반 식당은 식당 별점 표시
    if (
      ratings?.restaurantRating !== undefined &&
      ratings?.restaurantRating !== null
    ) {
      return ratings.restaurantRating.toFixed(1);
    }
    return "0.0";
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

  if (!user) {
    return null;
  }

  return (
    <div className="mypage-container">
      <div className="mypage-content">
        <h1>마이페이지</h1>

        <div className="user-info-section">
          <h2>사용자 정보</h2>
          <div className="info-item">
            <span className="info-label">닉네임:</span>
            <span className="info-value">{user.nickname}</span>
          </div>
          <div className="info-item">
            <span className="info-label">이메일:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">역할:</span>
            <span className="info-value">
              {user.role === "ADMIN" ? "관리자" : "사용자"}
            </span>
          </div>
        </div>

        {(message || error) && (
          <div className={`message ${error ? "error" : "success"}`}>
            {message || error}
          </div>
        )}

        <div className="settings-section">
          <h2>닉네임 변경</h2>
          <form onSubmit={handleNicknameUpdate} className="settings-form">
            <div className="form-group">
              <label htmlFor="nickname">새 닉네임</label>
              <input
                type="text"
                id="nickname"
                value={nickname || ""}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="새 닉네임을 입력하세요"
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              닉네임 변경
            </button>
          </form>
        </div>

        <div className="settings-section">
          <h2>비밀번호 변경</h2>
          <form onSubmit={handlePasswordUpdate} className="settings-form">
            <div className="form-group">
              <label htmlFor="currentPassword">현재 비밀번호</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">새 비밀번호</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">새 비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              비밀번호 변경
            </button>
          </form>
        </div>

        <div className="reviews-section">
          <h2>내가 작성한 리뷰 ({myReviews.length}개)</h2>
          <div className="reviews-list">
            {myReviews.length > 0 ? (
              myReviews.map((review) => (
                <div
                  key={review._id}
                  className="review-card"
                  onClick={() => handleReviewClick(review)}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="review-header">
                    <h3>
                      {review.target?.restaurantId === "MAIN_CAMPUS"
                        ? "우정원"
                        : (review.target?.restaurantId &&
                            restaurantNameMap[review.target.restaurantId]) ||
                          review.target?.restaurantName ||
                          review.restaurantName ||
                          "식당 정보 없음"}
                    </h3>
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>
                        {getAverageRating(review)}
                      </span>
                    </div>
                  </div>
                  {(() => {
                    const ratings = (review as any).rating || review.ratings;
                    const restaurantId = review.restaurantId || review.target?.restaurantId;
                    return ratings?.menuRatings && ratings.menuRatings.length > 0 ? (
                      <div className="menu-tags">
                        {ratings.menuRatings?.map(
                          (
                            menuRating: { menuId: string; menuName?: string; rating: number },
                            index: number
                          ) => {
                            const menuName = restaurantId === "MAIN_CAMPUS"
                              ? getMenuNameById(menuRating.menuId)
                              : restaurantId
                              ? getOffCampusMenuName(restaurantId, menuRating.menuId)
                              : null;
                            return (
                              <span
                                key={`my-review-${review._id}-menu-${index}`}
                                className="menu-tag"
                              >
                                {menuName || menuRating.menuName || "메뉴 정보 없음"}
                              </span>
                            );
                          }
                        )}
                      </div>
                    ) : null;
                  })()}
                  <p className="review-content">{review.content}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="review-likes">👍 {review.likeCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-reviews">아직 작성한 리뷰가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="reviews-section">
          <h2>내가 좋아요한 리뷰 ({likedReviews.length}개)</h2>
          <div className="reviews-list">
            {likedReviews.length > 0 ? (
              likedReviews.map((review) => (
                <div
                  key={review._id}
                  className="review-card"
                  onClick={() => handleReviewClick(review)}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="review-header">
                    <h3>
                      {review.target?.restaurantId === "MAIN_CAMPUS"
                        ? "우정원"
                        : (review.target?.restaurantId &&
                            restaurantNameMap[review.target.restaurantId]) ||
                          review.target?.restaurantName ||
                          review.restaurantName ||
                          "식당 정보 없음"}
                    </h3>
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>
                        {getAverageRating(review)}
                      </span>
                    </div>
                  </div>
                  <div className="review-author-info">
                    <span className="review-author">
                      작성자: {review.nickname}
                    </span>
                  </div>
                  {(() => {
                    const ratings = (review as any).rating || review.ratings;
                    const restaurantId = review.restaurantId || review.target?.restaurantId;
                    return ratings?.menuRatings && ratings.menuRatings.length > 0 ? (
                      <div className="menu-tags">
                        {ratings.menuRatings?.map(
                          (
                            menuRating: { menuId: string; menuName?: string; rating: number },
                            index: number
                          ) => {
                            const menuName = restaurantId === "MAIN_CAMPUS"
                              ? getMenuNameById(menuRating.menuId)
                              : restaurantId
                              ? getOffCampusMenuName(restaurantId, menuRating.menuId)
                              : null;
                            return (
                              <span
                                key={`liked-review-${review._id}-menu-${index}`}
                                className="menu-tag"
                              >
                                {menuName || menuRating.menuName || "메뉴 정보 없음"}
                              </span>
                            );
                          }
                        )}
                      </div>
                    ) : null;
                  })()}
                  <p className="review-content">{review.content}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="review-likes">👍 {review.likeCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-reviews">아직 좋아요한 리뷰가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="settings-section delete-account-section">
          <h2>회원 탈퇴</h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger"
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              회원 탈퇴하기
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="settings-form">
              <div className="form-group">
                <label htmlFor="deletePassword">
                  탈퇴하려면 현재 비밀번호를 입력하세요
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  className="btn-danger"
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  탈퇴 확인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setError("");
                  }}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="logout-section">
          <button onClick={handleLogout} className="btn-logout">
            로그아웃
          </button>
        </div>
      </div>

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

export default MyPage;
