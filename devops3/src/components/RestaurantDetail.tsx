import { type Restaurant, reviewsData, getAverageRating, getReviewCount } from '../data/places';
import './RestaurantDetail.css';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onClose: () => void;
}

function RestaurantDetail({ restaurant, onClose }: RestaurantDetailProps) {
  const reviews = reviewsData.filter(review => review.target.restaurantId === restaurant._id);
  const averageRating = getAverageRating(restaurant._id);
  const reviewCount = getReviewCount(restaurant._id);

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
        <h3>리뷰</h3>
        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map(review => {
              const avgRating = (review.ratings.taste + review.ratings.price + review.ratings.atmosphere) / 3;
              return (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>{avgRating.toFixed(1)}</span>
                    </div>
                    <span className="review-author">{review.nickname}</span>
                  </div>
                  {review.target.menuItems && (
                    <div className="menu-tag">{review.target.menuItems}</div>
                  )}
                  <p className="review-content">{review.content}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <div className="review-actions">
                      <span>👍 {review.likeCount}</span>
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
    </div>
  );
}

export default RestaurantDetail;
