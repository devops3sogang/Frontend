import { useState } from "react";
import {
  adminCreateRestaurant,
  adminUpdateRestaurant,
} from "../api/restaurants";
import type { Restaurant } from "../data/places";
import type { CreateRestaurantRequest } from "../api/types";
import "./RestaurantDetail.css"; // 스타일 재사용

interface RestaurantFormProps {
  mode: "create" | "edit";
  initialData?: Restaurant;
  onClose: () => void;
  onSubmitSuccess?: (payload: CreateRestaurantRequest) => void | Promise<void>;
}

function RestaurantForm({
  mode,
  initialData,
  onClose,
  onSubmitSuccess,
}: RestaurantFormProps) {
  // --- 기본 폼 상태 ---
  const [form, setForm] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    address: initialData?.address || "",
    lat: initialData?.location?.coordinates?.[1] ?? 37.5511,
    lng: initialData?.location?.coordinates?.[0] ?? 126.9418,
    imageUrl: initialData?.imageUrl || "",
    isActive: initialData?.isActive ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- 저장 버튼 클릭 시 ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ CreateRestaurantRequest 형태의 payload 생성
    const payload: CreateRestaurantRequest = {
      name: form.name.trim(),
      type: "OFF_CAMPUS",
      category: form.category.trim(),
      address: form.address.trim(),
      location: {
        type: "Point",
        coordinates: [Number(form.lng), Number(form.lat)], // [경도, 위도]
      },
      imageUrl: form.imageUrl || undefined,
    };

    // ✅ 부모에게 payload 전달 (API 호출은 부모 컴포넌트에서 수행)
    onSubmitSuccess?.(payload);
  };

  return (
    <div className="restaurant-form-overlay">
      <div className="restaurant-form">
        <h2>{mode === "create" ? "새 식당 등록" : "식당 정보 수정"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            식당 이름
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            카테고리
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            주소
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
            />
          </label>

          <div className="form-row">
            <label>
              위도(lat)
              <input
                type="number"
                step="any"
                name="lat"
                value={form.lat}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              경도(lng)
              <input
                type="number"
                step="any"
                name="lng"
                value={form.lng}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            이미지 URL (선택)
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {mode === "create" ? "등록" : "저장"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => onClose()}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestaurantForm;