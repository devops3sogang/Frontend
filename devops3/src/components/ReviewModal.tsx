// 리뷰 쓸 때 뜨는 모달

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Restaurant } from "../data/places";
import type { ReviewResponse } from "../api/types";
import { uploadImage } from "../api/images";
import { getFullImageUrl } from "../utils/imageUtils";
import "./ReviewModal.css";

interface ReviewModalProps {
  restaurant: Restaurant;
  existingReview?: ReviewResponse; // 수정할 리뷰가 있으면 전달
  onClose: () => void;
  onSubmit: (reviewData: Partial<ReviewResponse>) => void;
}

interface MenuRatingState {
  menuName: string;
  rating: number;
}

function ReviewModal({
  restaurant,
  existingReview,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [selectedMenus, setSelectedMenus] = useState<string[]>(
    existingReview?.ratings.menuRatings.map((mr) => mr.menuName) || []
  );
  const [menuRatings, setMenuRatings] = useState<MenuRatingState[]>(
    existingReview?.ratings.menuRatings || []
  );
  const [restaurantRating, setRestaurantRating] = useState(
    existingReview?.ratings.restaurantRating || 0
  );
  const [content, setContent] = useState(existingReview?.content || "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    existingReview?.imageUrls || []
  );

  const handleMenuToggle = (menuName: string) => {
    setSelectedMenus((prev) => {
      if (prev.includes(menuName)) {
        // 메뉴 선택 해제 - 해당 메뉴의 별점도 제거
        setMenuRatings((prevRatings) =>
          prevRatings.filter((mr) => mr.menuName !== menuName)
        );
        return prev.filter((m) => m !== menuName);
      } else {
        // 메뉴 선택
        return [...prev, menuName];
      }
    });
  };

  const handleMenuRatingChange = (menuName: string, rating: number) => {
    setMenuRatings((prev) => {
      const existing = prev.find((mr) => mr.menuName === menuName);
      if (existing) {
        return prev.map((mr) =>
          mr.menuName === menuName ? { ...mr, rating } : mr
        );
      } else {
        return [...prev, { menuName, rating }];
      }
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 6;
    const remainingSlots = maxImages - imageUrls.length;

    console.log("Selected files:", files.length);
    console.log("Current images:", imageUrls.length);
    console.log("Remaining slots:", remainingSlots);

    if (remainingSlots <= 0) {
      alert("최대 6개의 이미지만 첨부할 수 있습니다.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    console.log("Files to process:", filesToProcess.length);

    // 각 파일을 서버에 업로드하고 URL을 받아옴
    try {
      const uploadPromises = filesToProcess.map(async (file) => {
        try {
          const imageUrl = await uploadImage(file);
          return imageUrl;
        } catch (error) {
          console.error("Failed to upload image:", error);
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log("Uploaded image URLs:", uploadedUrls);

      setImageUrls((prev) => {
        const newUrls = [...prev, ...uploadedUrls];
        console.log("New image URLs count:", newUrls.length);
        return newUrls;
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    }

    // input 초기화
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (menuRatings.length === 0) {
      alert("최소 하나의 메뉴에 별점을 매겨주세요.");
      return;
    }

    if (restaurantRating === 0) {
      alert("가게 별점을 매겨주세요.");
      return;
    }

    const reviewData: Partial<ReviewResponse> = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      ratings: {
        menuRatings: menuRatings,
        restaurantRating: restaurantRating,
      },
      content: content.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    onSubmit(reviewData);
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (rating: number) => void;
    label: string;
  }) => (
    <div className="rating-input">
      <label>{label}</label>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${value >= star ? "active" : ""}`}
            onClick={() => onChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingReview ? "리뷰 수정" : "리뷰 작성"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>식당</label>
            <input type="text" value={restaurant.name} disabled />
          </div>

          <div className="form-group">
            <StarRating
              label="가게 별점"
              value={restaurantRating}
              onChange={setRestaurantRating}
            />
          </div>

          {restaurant.menu && restaurant.menu.length > 0 && (
            <div className="form-group">
              <label>메뉴</label>
              <div className="menu-list">
                {restaurant.menu.map((item) => {
                  const isSelected = selectedMenus.includes(item.name);
                  const menuRating = menuRatings.find(
                    (mr) => mr.menuName === item.name
                  );
                  return (
                    <div
                      key={item.name}
                      className={`menu-item ${isSelected ? "selected" : ""}`}
                    >
                      <div
                        className="menu-info"
                        onClick={() => handleMenuToggle(item.name)}
                      >
                        <span className="menu-name">{item.name}</span>
                        <span className="menu-price">
                          {item.price.toLocaleString()}원
                        </span>
                      </div>
                      {isSelected && (
                        <div className="menu-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${
                                menuRating && menuRating.rating >= star
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                handleMenuRatingChange(item.name, star)
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                  console.log(
                    "Rendering image",
                    index,
                    "URL:",
                    url
                  );
                  return (
                    <div key={index} className="image-preview-container">
                      <img
                        src={getFullImageUrl(url)}
                        alt={`미리보기 ${index + 1}`}
                        className="image-preview"
                      />
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
              {existingReview ? "수정하기" : "작성하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(modalContent, document.body);
}

export default ReviewModal;
