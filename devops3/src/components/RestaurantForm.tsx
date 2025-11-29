import { useState } from "react";
import type { Restaurant } from "../data/places";
import type { CreateRestaurantRequest, MenuItemInput } from "../api/types";
import { uploadImage } from "../api";
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

  // ✅ 메뉴 입력 상태 (최소 1줄 보장)
  const [menuItems, setMenuItems] = useState<MenuItemInput[]>(
    initialData?.menu?.length
      ? initialData.menu.map((m) => ({ name: m.name, price: m.price }))
      : [{ name: "", price: 0 }]
  );

  // 이미지 업로드 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || "");
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("이미지 파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }

      setImageFile(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ 메뉴 조작 핸들러
  const addMenuItem = () => {
    setMenuItems((prev) => [...prev, { name: "", price: 0 }]);
  };

  const removeMenuItem = (idx: number) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const changeMenuItem = (
    idx: number,
    patch: Partial<MenuItemInput>
  ) => {
    setMenuItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  // --- 저장 버튼 클릭 시 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ 기본 필드 검증
    if (!form.name.trim()) {
      alert("식당 이름을 입력해 주세요.");
      return;
    }
    if (!form.category.trim()) {
      alert("카테고리를 입력해 주세요.");
      return;
    }
    if (!form.address.trim()) {
      alert("주소를 입력해 주세요.");
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert("위도/경도가 올바르지 않습니다.");
      return;
    }

    // ✅ 메뉴 최소 1개 + 각 항목 검증
    const cleanedMenu = menuItems
      .map((m) => ({ name: m.name.trim(), price: Number(m.price) }))
      .filter((m) => m.name.length > 0);

    if (cleanedMenu.length < 1) {
      alert("메뉴는 최소 1개 이상 등록해야 합니다.");
      return;
    }
    for (const m of cleanedMenu) {
      if (!Number.isFinite(m.price) || m.price < 0) {
        alert(`메뉴 "${m.name}"의 가격이 올바르지 않습니다.`);
        return;
      }
    }

    // ✅ 이미지 업로드 처리
    let uploadedImageUrl = form.imageUrl;
    if (imageFile) {
      try {
        setUploading(true);
        uploadedImageUrl = await uploadImage(imageFile);
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

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
      imageUrl: uploadedImageUrl || undefined,
      menu: cleanedMenu,
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
            식당 이미지 (선택)
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: "pointer",
              }}
            />
          </label>

          {imagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePreview}
                alt="미리보기"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            </div>
          )}

          {/* ✅ 메뉴 입력 섹션 */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: "12px 0" }}>메뉴</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {menuItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 80px",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    placeholder="메뉴명 (예: 돈코츠라멘)"
                    value={item.name}
                    onChange={(e) =>
                      changeMenuItem(idx, { name: e.target.value })
                    }
                  />
                  <input
                    placeholder="가격 (원)"
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) =>
                      changeMenuItem(idx, { price: Number(e.target.value) })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeMenuItem(idx)}
                    style={{
                      border: "1px solid #eee",
                      background: "#fff",
                      borderRadius: 8,
                      cursor: "pointer",
                      padding: "8px 0",
                    }}
                    disabled={menuItems.length <= 1} // 최소 1개 유지
                    title={
                      menuItems.length <= 1
                        ? "메뉴는 최소 1개 필요"
                        : "삭제"
                    }
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={addMenuItem}
                style={{
                  border: "1px dashed #bbb",
                  background: "#fff",
                  color: "#333",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                + 메뉴 추가
              </button>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "8px" }}>
            <button type="submit" className="btn-submit" disabled={uploading}>
              {uploading ? "이미지 업로드 중..." : mode === "create" ? "등록" : "저장"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => onClose()}
              disabled={uploading}
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