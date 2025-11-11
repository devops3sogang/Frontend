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
  onSubmitSuccess: () => void;
}

export default function RestaurantForm({
  mode,
  initialData,
  onClose,
  onSubmitSuccess,
}: RestaurantFormProps) {
  const [form, setForm] = useState<CreateRestaurantRequest>({
    name: initialData?.name || "",
    type: initialData?.type || "ON_CAMPUS",
    category: initialData?.category || "한식",
    address: initialData?.address || "",
    location: initialData?.location || {
      type: "Point",
      coordinates: [126.9410, 37.5509],
    },
    imageUrl: initialData?.imageUrl || "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        await adminCreateRestaurant(form);
        alert("새 식당이 등록되었습니다!");
      } else if (mode === "edit" && initialData) {
        await adminUpdateRestaurant(initialData.id, form);
        alert("식당 정보가 수정되었습니다!");
      }
      onSubmitSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{mode === "create" ? "식당 등록" : "식당 수정"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            이름
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            분류
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="ON_CAMPUS">교내</option>
              <option value="OFF_CAMPUS">교외</option>
            </select>
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

          <label>
            이미지 URL
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
            />
          </label>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              취소
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
