import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewsData, type Review, type Restaurant } from '../data/places'
import Roulette from '../components/Roulette'
import RestaurantDetail from '../components/RestaurantDetail'
import '../App.css'
import './Home.css'

function Home() {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // 최신 리뷰 5개 가져오기 (날짜순 정렬)
  const latestReviews = [...reviewsData]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getAverageRating = (ratings: Review['ratings']) => {
    // 가게 별점을 표시
    return ratings.restaurantRating.toFixed(1);
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
            {latestReviews.map((review) => (
              <div
                key={review._id}
                className="review-card"
                onClick={() => handleReviewClick(review.target.restaurantId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="review-header">
                  <div>
                    <span className="restaurant-name">{review.target.restaurantName}</span>
                    {review.target.menuItems && (
                      <span className="menu-items">
                        ({review.target.menuItems})
                      </span>
                    )}
                  </div>
                  <span className="rating">
                    ⭐ {getAverageRating(review.ratings)}
                  </span>
                </div>
                <p className="review-content">
                  {review.content}
                </p>
                <div className="review-footer">
                  <span>{review.nickname}</span>
                  <span>👍 {review.likeCount}</span>
                </div>
              </div>
            ))}
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
            <div>
              <p>메뉴 정보를 준비 중입니다...</p>
              <p className="menu-placeholder-subtext">데이터 양식이 정리되면 표시됩니다.</p>
            </div>
          </div>
        </div>        
      </div>

      {/* 선택된 식당 상세 정보 모달 */}
      {selectedRestaurant && (
        <div className="modal-overlay" onClick={() => setSelectedRestaurant(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RestaurantDetail
              restaurant={selectedRestaurant}
              onClose={() => setSelectedRestaurant(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
