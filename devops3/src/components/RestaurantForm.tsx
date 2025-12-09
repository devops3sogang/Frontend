import { useState } from "react";
import type { Restaurant } from "../data/places";
import type { CreateRestaurantRequest, MenuItemInput } from "../api/types";
import { uploadImage } from "../api";

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
  const [form, setForm] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    address: initialData?.address || "",
    lat: initialData?.location?.coordinates?.[1] ?? 37.5511,
    lng: initialData?.location?.coordinates?.[0] ?? 126.9418,
    imageUrl: initialData?.imageUrl || "",
    isActive: initialData?.isActive ?? true,
  });

  const [menuItems, setMenuItems] = useState<MenuItemInput[]>(
    initialData?.menu?.length
      ? initialData.menu.map((m) => ({ name: m.name, price: m.price }))
      : [{ name: "", price: 0 }]
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const processImageFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("이미지 파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const payload: CreateRestaurantRequest = {
      name: form.name.trim(),
      type: "OFF_CAMPUS",
      category: form.category.trim(),
      address: form.address.trim(),
      location: {
        type: "Point",
        coordinates: [Number(form.lng), Number(form.lat)],
      },
      imageUrl: uploadedImageUrl || undefined,
      isActive: form.isActive,
      menu: cleanedMenu,
    };

    onSubmitSuccess?.(payload);
  };

  return (
    <div onClick={onClose} style={styles.overlay}>
      <div onClick={(e) => e.stopPropagation()} style={styles.modal}>
        {/* 헤더 */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              {mode === "create" ? "✨ 새 식당 등록" : "✏️ 식당 정보 수정"}
            </h2>
            <p style={styles.subtitle}>
              {mode === "create"
                ? "새로운 맛집 정보를 등록해보세요"
                : "식당 정보를 수정할 수 있습니다"}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 기본 정보 섹션 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏪 기본 정보</h3>

            <div style={styles.inputGroup}>
              <label style={styles.label}>식당 이름 *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="예) 서강 맛집"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>카테고리 *</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="예) 한식, 중식, 일식..."
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>상태</label>
                <select
                  name="isActive"
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.value === "true",
                    }))
                  }
                  style={styles.select}
                >
                  <option value="true">✅ 운영중</option>
                  <option value="false">❌ 휴업</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>주소 *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="예) 서울시 마포구 백범로 35"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>위도 (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  name="lat"
                  value={form.lat}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>경도 (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  name="lng"
                  value={form.lng}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          {/* 이미지 섹션 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📷 식당 이미지</h3>

            <div
              style={styles.imageUploadContainer}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.fileInput}
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                style={{
                  ...styles.fileLabel,
                  ...(isDragging ? styles.fileLabelDragging : {}),
                }}
              >
                <span style={styles.uploadIcon}>{isDragging ? "📥" : "📸"}</span>
                <span style={styles.uploadText}>
                  {isDragging ? "여기에 놓으세요" : imageFile ? imageFile.name : "이미지 파일 선택 또는 드래그"}
                </span>
                <span style={styles.uploadHint}>JPG, PNG, GIF, WebP (최대 10MB)</span>
              </label>
            </div>

            {imagePreview && (
              <div style={styles.imagePreviewContainer}>
                <img
                  src={imagePreview}
                  alt="미리보기"
                  style={styles.imagePreview}
                />
              </div>
            )}
          </div>

          {/* 메뉴 섹션 */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>🍽️ 메뉴</h3>
              <button
                type="button"
                onClick={addMenuItem}
                style={styles.addMenuButton}
              >
                ➕ 메뉴 추가
              </button>
            </div>

            <div style={styles.menuList}>
              {menuItems.map((item, idx) => (
                <div key={idx} style={styles.menuItem}>
                  <div style={styles.menuInputs}>
                    <input
                      placeholder="메뉴명 (예: 김치찌개)"
                      value={item.name}
                      onChange={(e) =>
                        changeMenuItem(idx, { name: e.target.value })
                      }
                      style={{ ...styles.input, flex: 2 }}
                    />
                    <input
                      placeholder="가격"
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) =>
                        changeMenuItem(idx, { price: Number(e.target.value) })
                      }
                      style={{ ...styles.input, flex: 1 }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMenuItem(idx)}
                    disabled={menuItems.length <= 1}
                    style={{
                      ...styles.removeButton,
                      ...(menuItems.length <= 1 ? styles.removeButtonDisabled : {}),
                    }}
                    title={menuItems.length <= 1 ? "메뉴는 최소 1개 필요" : "삭제"}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              style={styles.cancelButton}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={styles.submitButton}
            >
              {uploading
                ? "⏳ 업로드 중..."
                : mode === "create"
                ? "✨ 등록하기"
                : "💾 저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "#fff",
    borderRadius: 24,
    maxWidth: 700,
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "32px",
    borderRadius: "24px 24px 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  closeButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: 40,
    height: 40,
    fontSize: 24,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  form: {
    padding: "32px",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: 18,
    fontWeight: 700,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 15,
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 15,
    transition: "all 0.2s ease",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  imageUploadContainer: {
    marginBottom: 16,
  },
  fileInput: {
    display: "none",
  },
  fileLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    border: "2px dashed #d1d5db",
    borderRadius: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#f9fafb",
  },
  fileLabelDragging: {
    border: "2px dashed #667eea",
    background: "#eef2ff",
    transform: "scale(1.02)",
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: 600,
    color: "#667eea",
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: "#9ca3af",
  },
  imagePreviewContainer: {
    borderRadius: 16,
    overflow: "hidden",
    border: "2px solid #e5e7eb",
  },
  imagePreview: {
    width: "100%",
    height: 250,
    objectFit: "cover",
    display: "block",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  menuItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  menuInputs: {
    flex: 1,
    display: "flex",
    gap: 12,
  },
  addMenuButton: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  removeButton: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "2px solid #fee2e2",
    background: "#fef2f2",
    color: "#ef4444",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  removeButtonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    paddingTop: 24,
    borderTop: "2px solid #f3f4f6",
  },
  cancelButton: {
    padding: "14px 32px",
    borderRadius: 12,
    border: "2px solid #e5e7eb",
    background: "#fff",
    color: "#6b7280",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  submitButton: {
    padding: "14px 32px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(245, 87, 108, 0.4)",
    transition: "all 0.2s ease",
  },
};

export default RestaurantForm;
