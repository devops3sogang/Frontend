import { useState } from 'react';
import { type Restaurant, type Review, reviewsData, getAverageRating, getReviewCount, addReview, updateReview, deleteReview, toggleReviewLike, isReviewLiked } from '../data/places';
import ReviewModal from './ReviewModal';
import './RestaurantDetail.css';

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
            className={`star ${rating >= starValue ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
};

function RestaurantDetail({ restaurant, onClose }: RestaurantDetailProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0); // 리뷰 목록 강제 갱신용
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null); // 리뷰 내용 확장용
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({}); // 리뷰별 현재 이미지 인덱스

  const reviews = reviewsData.filter(review => review.target.restaurantId === restaurant._id);
  const averageRating = getAverageRating(restaurant._id);
  const reviewCount = getReviewCount(restaurant._id);

  const handleAddReview = () => {
    setEditingReview(undefined);
    setShowReviewModal(true);
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm('리뷰를 삭제하시겠습니까?')) {
      deleteReview(reviewId);
      setRefreshKey(prev => prev + 1); // 강제 갱신
    }
  };

  const handleSubmitReview = (reviewData: Partial<Review>) => {
    if (editingReview) {
      // 수정
      updateReview(editingReview._id, reviewData);
    } else {
      // 추가
      addReview(reviewData);
    }
    setShowReviewModal(false);
    setEditingReview(undefined);
    setRefreshKey(prev => prev + 1); // 강제 갱신
  };

  const handleToggleLike = (reviewId: string) => {
    toggleReviewLike(reviewId);
    setRefreshKey(prev => prev + 1); // 강제 갱신
  };

  const handleNextImage = (reviewId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [reviewId]: ((prev[reviewId] || 0) + 1) % totalImages
    }));
  };

  const handlePrevImage = (reviewId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [reviewId]: ((prev[reviewId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleToggleDetails = (reviewId: string) => {
    setExpandedReviewId(prevId => (prevId === reviewId ? null : reviewId));
  };

  return (
    <div className="restaurant-detail">
      <div className="detail-header">
        <h2>{restaurant.name}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="rating-section">
        <span className="star">★</span>
        <span className="rating-value">{averageRating.toFixed(1)}</span>
        <span className="review-count">({reviewCount}개 리뷰)</span>
      </div>

      {restaurant.menu && restaurant.menu.length > 0 && (
        <div className="menu-section">
          <h3>메뉴</h3>
          <ul className="menu-list">
            {restaurant.menu.map((item) => (
              <li key={item.name}>
                <span className="menu-name">{item.name}</span>
                <span className="menu-price">{item.price.toLocaleString()}원</span>
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
        <div className="reviews-list" key={refreshKey}>
          {reviews.length > 0 ? (
            reviews.map(review => {
              const avgRating = (review.ratings.taste + review.ratings.price + review.ratings.atmosphere) / 3;
              return (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="review-rating" onClick={() => handleToggleDetails(review._id)}>
                      <span className="star">★</span>
                      <span>{avgRating.toFixed(1)}</span>
                      <span className={`material-symbols-outlined expand-icon ${expandedReviewId === review._id ? 'expanded' : ''}`}> expand_more </span>
                    </div>
                    <div className="review-author-actions">
                      <span className="review-author">{review.nickname}</span>
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
                    </div>
                  </div>
                  {expandedReviewId === review._id && (
                      <div className="review-ratings-detail">
                        <StarRatingDisplay label="맛" rating={review.ratings.taste} />
                        <StarRatingDisplay label="가격" rating={review.ratings.price} />
                        <StarRatingDisplay label="분위기" rating={review.ratings.atmosphere} />
                      </div>
                    )}
                  {review.target.menuItems && (
                    <div className="menu-tag">{review.target.menuItems}</div>
                  )}
                  <p className="review-content">{review.content}</p>
                  {(() => {
                    const images = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
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
                          />
                          {images.length > 1 && (
                            <>
                              <button
                                className="image-nav-btn prev"
                                onClick={() => handlePrevImage(review._id, images.length)}
                              >
                                <span className="material-symbols-outlined">chevron_left</span>
                              </button>
                              <button
                                className="image-nav-btn next"
                                onClick={() => handleNextImage(review._id, images.length)}
                              >
                                <span className="material-symbols-outlined">chevron_right</span>
                              </button>
                              <div className="image-indicators">
                                {images.map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`indicator ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentImageIndex(prev => ({ ...prev, [review._id]: idx }))}
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
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <div className="review-actions">
                      <button
                        className={`btn-like ${isReviewLiked(review._id) ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(review._id)}
                        title={isReviewLiked(review._id) ? '좋아요 취소' : '좋아요'}
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
    </div>
  );
}

export default RestaurantDetail;
