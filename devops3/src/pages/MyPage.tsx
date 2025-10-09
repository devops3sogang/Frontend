// 마이페이지

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reviewsData, type Review } from '../data/places';
import { updateUserNickname, updateUserPassword } from '../data/users';
import { getLikesByUser } from '../data/likes';
import './MyPage.css';

function MyPage() {
  const { user, logout, updateNickname, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [likedReviews, setLikedReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setNickname(user.nickname);
      // 내가 작성한 리뷰 가져오기
      const userReviews = reviewsData.filter(review => review.userId === user._id);
      setMyReviews(userReviews);

      // 내가 좋아요한 리뷰 가져오기
      const likedReviewIds = getLikesByUser(user._id);
      const likedReviewsList = reviewsData.filter(review => likedReviewIds.includes(review._id));
      setLikedReviews(likedReviewsList);
    }
  }, [user, isAuthenticated, navigate]);

  const handleNicknameUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user) return;

    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    const success = updateUserNickname(user._id, nickname);
    if (success) {
      updateNickname(nickname);
      setMessage('닉네임이 성공적으로 변경되었습니다.');

      // 내 리뷰의 닉네임도 업데이트
      myReviews.forEach(review => {
        if (review.userId === user._id) {
          review.nickname = nickname;
        }
      });
    } else {
      setError('닉네임 변경에 실패했습니다.');
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user) return;

    if (newPassword.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    const success = updateUserPassword(user._id, currentPassword, newPassword);
    if (success) {
      setMessage('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError('현재 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
            <span className="info-label">이메일:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">역할:</span>
            <span className="info-value">{user.role === 'ADMIN' ? '관리자' : '사용자'}</span>
          </div>
        </div>

        {(message || error) && (
          <div className={`message ${error ? 'error' : 'success'}`}>
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
                value={nickname}
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
              myReviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <h3>{review.target.restaurantName}</h3>
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>{review.ratings.restaurantRating.toFixed(1)}</span>
                    </div>
                  </div>
                  {review.target.menuItems && (
                    <div className="menu-tags">
                      {review.target.menuItems.split(', ').map((menuItem, index) => (
                        <span key={index} className="menu-tag">{menuItem}</span>
                      ))}
                    </div>
                  )}
                  <p className="review-content">{review.content}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
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
              likedReviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <h3>{review.target.restaurantName}</h3>
                    <div className="review-rating">
                      <span className="star">★</span>
                      <span>{review.ratings.restaurantRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="review-author-info">
                    <span className="review-author">작성자: {review.nickname}</span>
                  </div>
                  {review.target.menuItems && (
                    <div className="menu-tags">
                      {review.target.menuItems.split(', ').map((menuItem, index) => (
                        <span key={index} className="menu-tag">{menuItem}</span>
                      ))}
                    </div>
                  )}
                  <p className="review-content">{review.content}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
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
