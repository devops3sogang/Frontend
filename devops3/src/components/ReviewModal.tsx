import { useState } from 'react';
import type { Restaurant, Review } from '../data/places';
import './ReviewModal.css';

interface ReviewModalProps {
  restaurant: Restaurant;
  existingReview?: Review; // 수정할 리뷰가 있으면 전달
  onClose: () => void;
  onSubmit: (reviewData: Partial<Review>) => void;
}

function ReviewModal({ restaurant, existingReview, onClose, onSubmit }: ReviewModalProps) {
  const [selectedMenus, setSelectedMenus] = useState<string[]>(
    existingReview?.target.menuItems ? existingReview.target.menuItems.split(', ') : []
  );
  const [tasteRating, setTasteRating] = useState(existingReview?.ratings.taste || 0);
  const [priceRating, setPriceRating] = useState(existingReview?.ratings.price || 0);
  const [atmosphereRating, setAtmosphereRating] = useState(existingReview?.ratings.atmosphere || 0);
  const [content, setContent] = useState(existingReview?.content || '');

  const toggleMenu = (menuName: string) => {
    setSelectedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tasteRating === 0 || priceRating === 0 || atmosphereRating === 0) {
      alert('모든 항목에 별점을 매겨주세요.');
      return;
    }

    if (!content.trim()) {
      alert('리뷰 내용을 작성해주세요.');
      return;
    }

    const reviewData: Partial<Review> = {
      target: {
        type: 'RESTAURANT',
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        menuItems: selectedMenus.length > 0 ? selectedMenus.join(', ') : undefined
      },
      ratings: {
        taste: tasteRating,
        price: priceRating,
        atmosphere: atmosphereRating
      },
      content: content.trim()
    };

    onSubmit(reviewData);
  };

  const StarRating = ({
    value,
    onChange,
    label
  }: {
    value: number;
    onChange: (rating: number) => void;
    label: string
  }) => (
    <div className="rating-input">
      <label>{label}</label>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${value >= star ? 'active' : ''}`}
            onClick={() => onChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingReview ? '리뷰 수정' : '리뷰 작성'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>식당</label>
            <input type="text" value={restaurant.name} disabled />
          </div>

          {restaurant.menu && restaurant.menu.length > 0 && (
            <div className="form-group">
              <label>메뉴</label>
              <div className="menu-checkboxes">
                {restaurant.menu.map((item) => (
                  <label key={item.name} className="menu-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMenus.includes(item.name)}
                      onChange={() => toggleMenu(item.name)}
                    />
                    <span className="menu-checkbox-label">
                      {item.name} - {item.price.toLocaleString()}원
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <StarRating
              label="맛"
              value={tasteRating}
              onChange={setTasteRating}
            />
            <StarRating
              label="가격"
              value={priceRating}
              onChange={setPriceRating}
            />
            <StarRating
              label="분위기"
              value={atmosphereRating}
              onChange={setAtmosphereRating}
            />
          </div>

          <div className="form-group">
            <label>리뷰 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="식당에 대한 솔직한 리뷰를 남겨주세요..."
              rows={5}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-submit">
              {existingReview ? '수정하기' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
