// 맵에서 레스토랑 상세 정보

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Restaurant } from "../data/places";
import type { ReviewResponse, ReviewDetailResponse } from "../api/types";
import {
  getRestaurant,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewLike as apiToggleReviewLike,
  adminDeleteRestaurant,
} from "../api";
import { useAuth } from "../contexts/AuthContext";
import ReviewModal from "./ReviewModal";
import RestaurantForm from "./RestaurantForm";
import "./RestaurantDetail.css";

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onClose: () => void;
}

interface StarRatingDisplayProps {
  label: string;
  rating: number;
}

const StarRatingDisplay = ({ label, rating }: StarRatingDisplayProps) => {
  return (
    <div className="star-rating-display-row">
      <span className="rating-label">{label}</span>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <span
            key={starValue}
            className={`star ${rating >= starValue ? "filled" : "empty"}`}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
};

function RestaurantDetail({ restaurant, onClose }: RestaurantDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<
    ReviewDetailResponse | undefined
  >(undefined);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null); // 리뷰 내용 확장용
  const [currentImageIndex, setCurrentImageIndex] = useState<{
    [key: string]: number;
  }>({}); // 리뷰별 현재 이미지 인덱스
  const [expandedImage, setExpandedImage] = useState<string | null>(null); // 확대된 이미지 URL
  const [expandedImageList, setExpandedImageList] = useState<string[]>([]); // 확대된 이미지 리스트
  const [expandedImageIndex, setExpandedImageIndex] = useState(0); // 확대된 이미지의 인덱스

  const [reviews, setReviews] = useState<ReviewDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 관리자용 상태
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("edit");

  // 리뷰들의 restaurantRating 평균 계산
  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) => sum + (review.ratings?.restaurantRating || 0),
          0
        ) / reviews.length
      : 0;
  const reviewCount = reviews.length;

  // 리뷰 목록 가져오기
  const fetchDetails = async () => {
    if (!restaurant.id) {
      console.warn("Restaurant ID is undefined, skipping review fetch");
      setReviews([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getRestaurant(restaurant.id);
      const reviewsWithLikedStatus = (data.reviews || []).map(review => ({
        ...review,
        likedByCurrentUser: review.likedByCurrentUser ?? false,
      }));
      setReviews(reviewsWithLikedStatus);
    } catch (error) {
      console.error("Failed to fetch restaurant details:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDetails();
  }, [restaurant.id]);

  const handleAddReview = () => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setEditingReview(undefined);
    setShowReviewModal(true);
  };

  const handleEditReview = (review: ReviewDetailResponse) => {
    if (!isAuthenticated || !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (review.userId !== user._id) {
      alert("본인이 작성한 리뷰만 수정할 수 있습니다.");
      return;
    }
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!isAuthenticated || !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    const review = reviews.find((r) => r._id === reviewId);
    if (review && review.userId !== user._id && user.role !== "ADMIN") {
      alert("본인이 작성한 리뷰만 삭제할 수 있습니다.");
      return;
    }
    if (window.confirm("리뷰를 삭제하시겠습니까?")) {
      try {
        await deleteReview(reviewId);
        alert("리뷰가 삭제되었습니다.");
        await fetchDetails();
      } catch (error) {
        console.error("Failed to delete review:", error);
        alert("리뷰 삭제에 실패했습니다.");
      }
    }
  };

  const handleSubmitReview = async (reviewData: Partial<ReviewResponse>) => {
    if (editingReview) {
      // 수정
      try {
        await updateReview(editingReview._id, {
          content: reviewData.content,
          ratings: reviewData.ratings!,
          imageUrls: reviewData.imageUrls || [],
        });
        alert("리뷰가 수정되었습니다!");
        await fetchDetails();
      } catch (error) {
        console.error("Failed to update review:", error);
        alert("리뷰 수정에 실패했습니다.");
      }
    } else {
      // 추가
      try {
        await createReview(restaurant.id, {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          ratings: reviewData.ratings!,
          content: reviewData.content!,
          imageUrls: reviewData.imageUrls || [],
        });
        alert("리뷰가 작성되었습니다!");
        await fetchDetails();
      } catch (error) {
        console.error("Failed to create review:", error);
        alert("리뷰 작성에 실패했습니다.");
      }
    }
    setShowReviewModal(false);
    setEditingReview(undefined);
  };

  const handleToggleLike = async (reviewId: string) => {
    if (!isAuthenticated || !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const response = await apiToggleReviewLike(reviewId);
      console.log("Toggle like response:", response);
      console.log("likeCount from response:", response.likeCount);

      // API 응답의 likeCount를 사용하여 해당 리뷰만 업데이트
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                likedByCurrentUser: !review.likedByCurrentUser,
                likeCount: response.likeCount ?? 0,
              }
            : review
        )
      );
    } catch (error: any) {
      console.error("Failed to toggle like:", error);

      // 에러 메시지 상세화
      if (error.response?.status === 403) {
        alert("좋아요 권한이 없습니다. 다시 로그인해주세요.");
        navigate("/login");
      } else if (error.response?.status === 409) {
        alert("이미 좋아요를 누른 리뷰입니다.");
      } else if (error.response?.status === 404) {
        alert("리뷰를 찾을 수 없습니다.");
      } else {
        alert("좋아요 처리에 실패했습니다.");
      }
    }
  };

  // ✅ 관리자용 함수
  const handleEditRestaurant = () => {
    setFormMode("edit");
    setShowForm(true);
  };

  const handleDeleteRestaurant = async () => {
    if (!window.confirm("정말 이 식당을 삭제하시겠습니까?")) return;
    try {
      await adminDeleteRestaurant(restaurant.id);
      alert("식당이 삭제되었습니다.");
      onClose();                 // 패널 닫기
      // 필요하면 navigate("/map"); // 또는 부모 콜백으로 목록/마커 갱신
    } catch (error: any) {
      console.error("식당 삭제 실패:", error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        alert("권한이 없습니다. 관리자 계정으로 로그인해 주세요.");
        navigate("/login");
      } else {
        alert("식당 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleNextImage = (reviewId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [reviewId]: ((prev[reviewId] || 0) + 1) % totalImages,
    }));
  };

  const handlePrevImage = (reviewId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [reviewId]: ((prev[reviewId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  const handleToggleDetails = (reviewId: string) => {
    setExpandedReviewId((prevId) => (prevId === reviewId ? null : reviewId));
  };

  const handleImageClick = (images: string[], index: number) => {
    setExpandedImageList(images);
    setExpandedImageIndex(index);
    setExpandedImage(images[index]);
  };

  const handleNextModalImage = () => {
    if (expandedImageList.length > 0) {
      const newIndex = (expandedImageIndex + 1) % expandedImageList.length;
      setExpandedImageIndex(newIndex);
      setExpandedImage(expandedImageList[newIndex]);
    }
  };

  const handlePrevModalImage = () => {
    if (expandedImageList.length > 0) {
      const newIndex =
        (expandedImageIndex - 1 + expandedImageList.length) %
        expandedImageList.length;
      setExpandedImageIndex(newIndex);
      setExpandedImage(expandedImageList[newIndex]);
    }
  };

  const handleCloseModal = () => {
    setExpandedImage(null);
    setExpandedImageList([]);
    setExpandedImageIndex(0);
  };

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!expandedImage) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevModalImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextModalImage();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImage, expandedImageList, expandedImageIndex]);

  return (
    <div className="restaurant-detail">
      <div className="detail-header">
        <h2>{restaurant.name}</h2>

        {/* ✅ 관리자 전용 버튼 */}
        {user?.role.toUpperCase() === "ADMIN" && (
          <div className="admin-actions">
            <button className="btn-edit" onClick={handleEditRestaurant}>
              수정
            </button>
            <button className="btn-delete" onClick={handleDeleteRestaurant}>
              삭제
            </button>
          </div>
        )}

        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {restaurant.imageUrl && (
        <div className="restaurant-image-container">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="restaurant-main-image"
            onClick={() => handleImageClick([restaurant.imageUrl!], 0)}
          />
        </div>
      )}

      <div className="rating-section">
        <span className="star">★</span>
        <span className="rating-value">
          {averageRating?.toFixed(1) ?? "0.0"}
        </span>
        <span className="review-count">({reviewCount}개 리뷰)</span>
      </div>

      {restaurant.menu && restaurant.menu.length > 0 && (
        <div className="menu-section">
          <h3>메뉴</h3>
          <ul className="restaurant-menu-list">
            {restaurant.menu.map((item) => (
              <li key={item.name}>
                <span className="menu-name">{item.name}</span>
                <span className="menu-price">
                  {item.price.toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ RestaurantForm 추가 */}
      {showForm && (
        <RestaurantForm
          mode={formMode}
          initialData={restaurant}
          onClose={() => setShowForm(false)}
          onSubmitSuccess={async () => {
            setShowForm(false);
            await fetchDetails(); // ← 최신 상세만 다시 불러와 반영
          }}
        />
      )}

      <div className="reviews-section">
        <div className="reviews-header">
          <h3>리뷰</h3>
          <button className="btn-add-review" onClick={handleAddReview}>
            리뷰 작성
          </button>
        </div>
        <div className="reviews-list">
          {loading ? (
            <div className="loading-spinner">
              <p>리뷰를 불러오는 중...</p>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => {
              return (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div
                      className="review-rating"
                      onClick={() => handleToggleDetails(review._id)}
                    >
                      <span className="star">★</span>
                      <span>
                        {review.ratings?.restaurantRating?.toFixed(1) ?? "0.0"}
                      </span>
                      <span
                        className={`material-symbols-outlined expand-icon ${
                          expandedReviewId === review._id ? "expanded" : ""
                        }`}
                      >
                        {" "}
                        expand_more{" "}
                      </span>
                    </div>
                    <div className="review-author-actions">
                      <span className="review-author">{review.nickname}</span>
                      {user && review.userId === user._id && (
                        <div className="review-edit-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditReview(review)}
                            title="수정"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteReview(review._id)}
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedReviewId === review._id && (
                    <div className="review-ratings-detail">
                      <div className="menu-ratings-section">
                        {review.ratings.menuRatings.map(
                          (mr: { menuName: string; rating: number }) => (
                            <StarRatingDisplay
                              key={mr.menuName}
                              label={mr.menuName}
                              rating={mr.rating}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {review.ratings?.menuRatings &&
                    review.ratings.menuRatings.length > 0 && (
                      <div className="menu-tags">
                        {review.ratings.menuRatings.map(
                          (
                            menuRating: { menuName: string; rating: number },
                            index: number
                          ) => (
                            <div key={index} className="menu-tag">
                              {menuRating.menuName}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  <p className="review-content">{review.content}</p>
                  {(() => {
                    const images = review.imageUrls || [];
                    if (images.length === 0) return null;

                    const currentIndex = currentImageIndex[review._id] || 0;
                    let touchStartX = 0;
                    let touchEndX = 0;

                    const handleTouchStart = (e: React.TouchEvent) => {
                      touchStartX = e.touches[0].clientX;
                    };

                    const handleTouchMove = (e: React.TouchEvent) => {
                      touchEndX = e.touches[0].clientX;
                    };

                    const handleTouchEnd = () => {
                      if (touchStartX - touchEndX > 50) {
                        // 왼쪽으로 스와이프
                        handleNextImage(review._id, images.length);
                      } else if (touchEndX - touchStartX > 50) {
                        // 오른쪽으로 스와이프
                        handlePrevImage(review._id, images.length);
                      }
                    };

                    return (
                      <div className="review-images-container">
                        <div
                          className="review-image-slider"
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          <img
                            src={images[currentIndex]}
                            alt={`리뷰 사진 ${currentIndex + 1}`}
                            className="review-image"
                            onClick={() =>
                              handleImageClick(images, currentIndex)
                            }
                          />
                          {images.length > 1 && (
                            <>
                              <button
                                className="image-nav-btn prev"
                                onClick={() =>
                                  handlePrevImage(review._id, images.length)
                                }
                              >
                                <span className="material-symbols-outlined">
                                  chevron_left
                                </span>
                              </button>
                              <button
                                className="image-nav-btn next"
                                onClick={() =>
                                  handleNextImage(review._id, images.length)
                                }
                              >
                                <span className="material-symbols-outlined">
                                  chevron_right
                                </span>
                              </button>
                              <div className="image-indicators">
                                {images.map((_: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`indicator ${
                                      idx === currentIndex ? "active" : ""
                                    }`}
                                    onClick={() =>
                                      setCurrentImageIndex((prev) => ({
                                        ...prev,
                                        [review._id]: idx,
                                      }))
                                    }
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="review-footer">
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <div className="review-actions">
                      <button
                        className={`btn-like ${
                          review.likedByCurrentUser ? "liked" : ""
                        }`}
                        onClick={() => handleToggleLike(review._id)}
                        title="좋아요"
                      >
                        👍 {review.likeCount ?? 0}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-reviews">아직 리뷰가 없습니다.</p>
          )}
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          restaurant={restaurant}
          existingReview={
            editingReview
              ? {
                  _id: editingReview._id,
                  userId: editingReview.userId,
                  nickname: editingReview.nickname,
                  target: {
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                  },
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                  ratings: editingReview.ratings,
                  content: editingReview.content || "",
                  imageUrls: editingReview.imageUrls,
                  likeCount: editingReview.likeCount,
                  createdAt: editingReview.createdAt,
                  likedByCurrentUser: editingReview.likedByCurrentUser,
                }
              : undefined
          }
          onClose={() => {
            setShowReviewModal(false);
            setEditingReview(undefined);
          }}
          onSubmit={handleSubmitReview}
        />
      )}

      {expandedImage && (
        <div
          className="image-modal-overlay"
          onClick={handleCloseModal}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any).touchStartX = touch.clientX;
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any).touchEndX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const target = e.currentTarget as any;
            const touchStartX = target.touchStartX || 0;
            const touchEndX = target.touchEndX || touchStartX;

            if (touchStartX - touchEndX > 50) {
              // 왼쪽으로 스와이프 - 다음 이미지
              handleNextModalImage();
            } else if (touchEndX - touchStartX > 50) {
              // 오른쪽으로 스와이프 - 이전 이미지
              handlePrevModalImage();
            }
          }}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={expandedImage} alt="확대 이미지" />
            <button className="image-modal-close" onClick={handleCloseModal}>
              ×
            </button>
            {expandedImageList.length > 1 && (
              <>
                <button
                  className="image-nav-btn prev"
                  onClick={handlePrevModalImage}
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                <button
                  className="image-nav-btn next"
                  onClick={handleNextModalImage}
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
                <div className="image-indicators">
                  {expandedImageList.map((_, idx) => (
                    <span
                      key={idx}
                      className={`indicator ${
                        idx === expandedImageIndex ? "active" : ""
                      }`}
                      onClick={() => {
                        setExpandedImageIndex(idx);
                        setExpandedImage(expandedImageList[idx]);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDetail;
