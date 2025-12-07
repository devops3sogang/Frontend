// 마이페이지

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { ReviewResponse } from "../api/types";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "../api/users";
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
          setMyReviews(data.myReviews || []);
          setLikedReviews(data.likedReviews || []);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setMyReviews([]);
          setLikedReviews([]);
        }
      };

      fetchUserProfile();
    }
  }, [user?.nickname, isAuthenticated, navigate]);

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

    if (restaurantId) {
      console.log("Navigating to:", `/map?restaurantId=${restaurantId}`);
      navigate(`/map?restaurantId=${restaurantId}`);
    } else {
      console.warn("No restaurantId found in review:", review);
    }
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
                      {review.target?.restaurantName ||
                        review.restaurantName ||
                        "식당 정보 없음"}
                    </h3>
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>
                        {review.ratings?.restaurantRating?.toFixed(1) ?? "0.0"}
                      </span>
                    </div>
                  </div>
                  {review.ratings?.menuRatings &&
                    review.ratings.menuRatings.length > 0 && (
                      <div className="menu-tags">
                        {review.ratings.menuRatings?.map(
                          (
                            menuRating: { menuName: string; rating: number },
                            index: number
                          ) => (
                            <span
                              key={`my-review-${review._id}-menu-${index}`}
                              className="menu-tag"
                            >
                              {menuRating.menuName}
                            </span>
                          )
                        )}
                      </div>
                    )}
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
                      {review.target?.restaurantName ||
                        review.restaurantName ||
                        "식당 정보 없음"}
                    </h3>
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>
                        {review.ratings?.restaurantRating?.toFixed(1) ?? "0.0"}
                      </span>
                    </div>
                  </div>
                  <div className="review-author-info">
                    <span className="review-author">
                      작성자: {review.nickname}
                    </span>
                  </div>
                  {review.ratings?.menuRatings &&
                    review.ratings.menuRatings.length > 0 && (
                      <div className="menu-tags">
                        {review.ratings.menuRatings?.map(
                          (
                            menuRating: { menuName: string; rating: number },
                            index: number
                          ) => (
                            <span
                              key={`liked-review-${review._id}-menu-${index}`}
                              className="menu-tag"
                            >
                              {menuRating.menuName}
                            </span>
                          )
                        )}
                      </div>
                    )}
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
    </div>
  );
}

export default MyPage;
