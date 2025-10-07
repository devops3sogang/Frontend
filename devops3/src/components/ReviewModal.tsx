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
  const [imageUrls, setImageUrls] = useState<string[]>(
    existingReview?.imageUrls || (existingReview?.imageUrl ? [existingReview.imageUrl] : [])
  );

  const toggleMenu = (menuName: string) => {
    setSelectedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 6;
    const remainingSlots = maxImages - imageUrls.length;

    console.log('Selected files:', files.length);
    console.log('Current images:', imageUrls.length);
    console.log('Remaining slots:', remainingSlots);

    if (remainingSlots <= 0) {
      alert('최대 6개의 이미지만 첨부할 수 있습니다.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    console.log('Files to process:', filesToProcess.length);

    // 모든 파일을 Promise로 변환
    const filePromises = filesToProcess.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    // 모든 파일 읽기가 완료될 때까지 기다린 후 한 번에 추가
    const base64Strings = await Promise.all(filePromises);
    console.log('Base64 strings loaded:', base64Strings.length);
    setImageUrls(prev => {
      const newUrls = [...prev, ...base64Strings];
      console.log('New image URLs count:', newUrls.length);
      return newUrls;
    });

    // input 초기화
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tasteRating === 0 || priceRating === 0 || atmosphereRating === 0) {
      alert('모든 항목에 별점을 매겨주세요.');
      return;
    }

    // if (!content.trim()) {
    //   alert('리뷰 내용을 작성해주세요.');
    //   return;
    // }

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
      content: content.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined // 하위 호환성
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
              placeholder="식당에 대한 솔직한 리뷰를 남겨주세요."
              rows={5}
              // required
            />
          </div>

          <div className="form-group">
            <label>사진 첨부</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="image-input"
              disabled={imageUrls.length >= 6}
            />
            <div className="image-count-info">
              {imageUrls.length}/6개 첨부됨
            </div>
            {imageUrls.length > 0 && (
              <div className="images-preview-grid">
                {imageUrls.map((url, index) => {
                  console.log('Rendering image', index, 'URL length:', url.length);
                  return (
                    <div key={index} className="image-preview-container">
                      <img src={url} alt={`미리보기 ${index + 1}`} className="image-preview" />
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => handleRemoveImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
