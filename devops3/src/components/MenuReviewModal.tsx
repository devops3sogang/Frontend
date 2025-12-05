import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReviewResponse } from "../api/types";
import { getMenuReviews, createMenuReview } from "../api/reviews";
import "./MenuReviewModal.css";

interface MenuReviewModalProps {
  restaurantId: string;
  menuId: string;
  menuName: string;
  onClose: () => void;
}

function MenuReviewModal({ restaurantId, menuId, menuName, onClose }: MenuReviewModalProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 리뷰 목록 가져오기
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getMenuReviews(restaurantId, menuId);
        setReviews(data);
      } catch (error) {
        console.error("Failed to fetch menu reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [restaurantId, menuId]);

  // 리뷰 작성
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("평점을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        restaurantId, // 'MAIN_CAMPUS' 또는 실제 restaurantId
        targetType: "MENU" as const,
        menuIds: [menuId], // 단일 메뉴 ID 배열
        rating: {
          menuRatings: [
            {
              menuId,
              menuName,
              rating,
            },
          ],
        },
        content: content.trim() || undefined,
      };

      console.log("📤 리뷰 작성 요청 데이터:", requestData);
      console.log("🔑 JWT 토큰:", localStorage.getItem("jwt_token"));

      const newReview = await createMenuReview(requestData);

      console.log("✅ 리뷰 작성 성공:", newReview);

      // 새 리뷰를 목록에 추가
      setReviews([newReview, ...reviews]);

      // 폼 초기화
      setRating(0);
      setContent("");
      setIsWritingReview(false);

      alert("리뷰가 작성되었습니다!");
    } catch (error: any) {
      console.error("❌ 리뷰 작성 실패:", error);
      console.error("❌ 에러 응답:", error.response?.data);
      console.error("❌ 에러 상태:", error.response?.status);

      const errorMessage = error.response?.data?.message || error.message || "리뷰 작성에 실패했습니다.";
      alert(`리뷰 작성 실패: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    readonly = false,
  }: {
    value: number;
    onChange?: (rating: number) => void;
    readonly?: boolean;
  }) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${value >= star ? "active" : ""} ${readonly ? "readonly" : ""}`}
          onClick={() => !readonly && onChange && onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content menu-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{menuName}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!isWritingReview ? (
            // 리뷰 목록 표시
            <>
              {loading ? (
                <p className="loading-text">로딩 중...</p>
              ) : reviews.length === 0 ? (
                <p className="no-reviews">아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => {
                    // 해당 메뉴에 대한 평점 찾기
                    const menuRating = review.ratings.menuRatings.find(
                      (mr) => mr.menuId === menuId
                    );
                    const displayRating = menuRating?.rating || 0;

                    return (
                      <div key={review._id} className="review-item">
                        <div className="review-header">
                          <span className="reviewer-name">{review.nickname}</span>
                          <StarRating value={displayRating} readonly />
                        </div>
                        {review.content && (
                          <p className="review-content">{review.content}</p>
                        )}
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 플로팅 연필 버튼 */}
              <button
                className="floating-write-btn"
                onClick={() => setIsWritingReview(true)}
                title="리뷰 작성"
              >
                ✏️
              </button>
            </>
          ) : (
            // 리뷰 작성 폼
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label>평점 *</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div className="form-group">
                <label>리뷰 내용 (선택)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="메뉴에 대한 솔직한 리뷰를 남겨주세요."
                  rows={5}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsWritingReview(false);
                    setRating(0);
                    setContent("");
                  }}
                  disabled={submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || rating === 0}
                >
                  {submitting ? "작성 중..." : "작성하기"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default MenuReviewModal;
