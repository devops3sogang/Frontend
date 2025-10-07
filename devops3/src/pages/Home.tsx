import { reviewsData, type Review } from '../data/places'
import '../App.css'

function Home() {
  // 최신 리뷰 5개 가져오기 (날짜순 정렬)
  const latestReviews = [...reviewsData]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getAverageRating = (ratings: Review['ratings']) => {
    return ((ratings.taste + ratings.price + ratings.atmosphere) / 3).toFixed(1);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* 최신 리뷰 컨테이너 */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>최신 리뷰</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {latestReviews.map((review) => (
              <div
                key={review._id}
                style={{
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #eee'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>{review.target.restaurantName}</strong>
                    {review.target.menuItems && (
                      <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                        ({review.target.menuItems})
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                    ⭐ {getAverageRating(review.ratings)}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '0.95rem' }}>
                  {review.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#999' }}>
                  <span>{review.nickname}</span>
                  <span>👍 {review.likeCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 우정원 메뉴 컨테이너 */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f0f8ff'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>오늘의 우정원 메뉴</h2>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '6px',
            textAlign: 'center',
            color: '#999',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <p>메뉴 정보를 준비 중입니다...</p>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>데이터 양식이 정리되면 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
