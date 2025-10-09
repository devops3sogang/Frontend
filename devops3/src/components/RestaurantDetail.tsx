// 맵에서 레스토랑 상세 정보

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Restaurant,
  type Review,
  reviewsData,
  getAverageRating,
  getReviewCount,
  addReview,
  updateReview,
  deleteReview,
  toggleReviewLike,
  isReviewLiked,
} from "../data/places";
import { useAuth } from "../contexts/AuthContext";
import ReviewModal from "./ReviewModal";
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
  const [editingReview, setEditingReview] = useState<Review | undefined>(
    undefined
  );
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null); // 리뷰 내용 확장용
  const [currentImageIndex, setCurrentImageIndex] = useState<{
    [key: string]: number;
  }>({}); // 리뷰별 현재 이미지 인덱스
  const [expandedImage, setExpandedImage] = useState<string | null>(null); // 확대된 이미지 URL
  const [expandedImageList, setExpandedImageList] = useState<string[]>([]); // 확대된 이미지 리스트
  const [expandedImageIndex, setExpandedImageIndex] = useState(0); // 확대된 이미지의 인덱스

  const [reviews, setReviews] = useState(() =>
    reviewsData.filter(
      (review) => review.target.restaurantId === restaurant._id
    )
  );
  const averageRating = getAverageRating(restaurant._id);
  const reviewCount = getReviewCount(restaurant._id);

  const handleAddReview = () => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setEditingReview(undefined);
    setShowReviewModal(true);
  };

  const handleEditReview = (review: Review) => {
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

  const handleDeleteReview = (reviewId: string) => {
    if (!isAuthenticated || !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    const review = reviewsData.find((r) => r._id === reviewId);
    if (review && review.userId !== user._id) {
      alert("본인이 작성한 리뷰만 삭제할 수 있습니다.");
      return;
    }
    if (window.confirm("리뷰를 삭제하시겠습니까?")) {
      deleteReview(reviewId);
      setReviews(
        reviewsData.filter(
          (review) => review.target.restaurantId === restaurant._id
        )
      );
    }
  };

  const handleSubmitReview = (reviewData: Partial<Review>) => {
    if (editingReview) {
      // 수정
      updateReview(editingReview._id, reviewData);
    } else {
      // 추가
      if (user) {
        addReview(reviewData, user._id, user.nickname);
      }
    }
    setShowReviewModal(false);
    setEditingReview(undefined);
    setReviews(
      reviewsData.filter(
        (review) => review.target.restaurantId === restaurant._id
      )
    );
  };

  const handleToggleLike = (reviewId: string) => {
    if (!isAuthenticated || !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    // 데이터 변경
    toggleReviewLike(reviewId, user._id);

    // 변경된 최신 데이터로 reviews 상태를 업데이트
    setReviews(
      reviewsData.filter(
        (review) => review.target.restaurantId === restaurant._id
      )
    );
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
        <span className="rating-value">{averageRating.toFixed(1)}</span>
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

      <div className="reviews-section">
        <div className="reviews-header">
          <h3>리뷰</h3>
          <button className="btn-add-review" onClick={handleAddReview}>
            리뷰 작성
          </button>
        </div>
        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map((review) => {
              return (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div
                      className="review-rating"
                      onClick={() => handleToggleDetails(review._id)}
                    >
                      <span className="star">★</span>
                      <span>{review.ratings.restaurantRating.toFixed(1)}</span>
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
                        {review.ratings.menuRatings.map((mr) => (
                          <StarRatingDisplay
                            key={mr.menuName}
                            label={mr.menuName}
                            rating={mr.rating}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {review.target.menuItems && (
                    <div className="menu-tags">
                      {review.target.menuItems
                        .split(", ")
                        .map((menuItem, index) => (
                          <div key={index} className="menu-tag">
                            {menuItem}
                          </div>
                        ))}
                    </div>
                  )}
                  <p className="review-content">{review.content}</p>
                  {(() => {
                    const images =
                      review.imageUrls ||
                      (review.imageUrl ? [review.imageUrl] : []);
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
                                {images.map((_, idx) => (
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
                          user && isReviewLiked(review._id, user._id)
                            ? "liked"
                            : ""
                        }`}
                        onClick={() => handleToggleLike(review._id)}
                        title={
                          user && isReviewLiked(review._id, user._id)
                            ? "좋아요 취소"
                            : "좋아요"
                        }
                      >
                        👍 {review.likeCount}
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
          existingReview={editingReview}
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
