import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getRestaurants,
  adminDeleteRestaurant,
  adminUpdateRestaurant,
  adminCreateRestaurant,
  adminGetReviews,
  adminDeleteReview,
  type ReviewResponse,
} from "../api";
import type { Restaurant } from "../data/places";
import RestaurantForm from "../components/RestaurantForm";
import { getFullImageUrl } from "../utils/imageUtils";

// 백엔드 응답을 프론트엔드 타입으로 변환
function mapBackendRestaurant(r: any): Restaurant {
  return {
    id: r._id || r.id,
    name: r.name,
    type: r.type,
    category: r.category,
    address: r.address,
    location: r.location,
    imageUrl: r.imageUrl,
    isActive: r.isActive ?? r.active ?? true,
    stats: {
      rating: r.stats?.rating ?? r.stats?.averageRating ?? 0,
      reviewCount: r.stats?.reviewCount ?? 0,
    },
    menu: r.menu || [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

type Tab = "restaurants" | "reviews";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("restaurants");

  // --- 레스토랑 상태 ---
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Restaurant | null>(null);

  // --- 리뷰 상태 ---
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewKeyword, setReviewKeyword] = useState("");
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null);

  // 목록 가져오기
  const loadRestaurants = async () => {
    setLoading(true);
    try {
      // 모든 식당 조회 (휴업 포함)
      const list = await getRestaurants({
        lat: 37.5511,
        lng: 126.9418,
        radius: 50000,
        sortBy: "NONE",
      });
      const mapped = list.map(mapBackendRestaurant);
      setRestaurants(mapped);
    } catch (e: any) {
      console.error("Failed to load restaurants:", e);
      alert(`레스토랑 목록을 불러오지 못했습니다: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 리뷰 목록 가져오기
  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const list = await adminGetReviews(100);
      setReviews(list);
    } catch (e: any) {
      console.error("Failed to load reviews:", e);
      alert(`리뷰 목록을 불러오지 못했습니다: ${e.message}`);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.toUpperCase() === "ADMIN") {
      loadRestaurants();
      loadReviews();
    }
  }, [user?.role]);

  const filtered = useMemo(() => {
    const k = keyword.trim();
    if (!k) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.includes(k) ||
        r.address.includes(k) ||
        r.category.includes(k)
    );
  }, [restaurants, keyword]);

  const filteredReviews = useMemo(() => {
    const k = reviewKeyword.trim();
    if (!k) return reviews;
    return reviews.filter(
      (r) =>
        r.restaurantName?.includes(k) ||
        r.nickname?.includes(k) ||
        r.content?.includes(k)
    );
  }, [reviews, reviewKeyword]);

  // 생성 버튼
  const handleCreate = () => {
    setFormMode("create");
    setEditing(null);
    setShowForm(true);
  };

  // 수정 버튼
  const handleEdit = (r: Restaurant) => {
    setFormMode("edit");
    setEditing(r);
    setShowForm(true);
  };

  // 삭제 버튼
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 관련 리뷰/좋아요도 제거될 수 있습니다.")) return;
    try {
      await adminDeleteRestaurant(id);
      await loadRestaurants();
      alert("삭제되었습니다.");
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        alert("권한이 없습니다. 관리자 계정으로 로그인해 주세요.");
      } else {
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 리뷰 삭제 버튼
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("정말 이 리뷰를 삭제하시겠습니까?")) return;
    try {
      await adminDeleteReview(reviewId);
      await loadReviews();
      setSelectedReview(null);
      alert("리뷰가 삭제되었습니다.");
    } catch (e: any) {
      console.error("리뷰 삭제 에러:", e);
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        alert(`권한이 없습니다. 관리자 계정으로 로그인해 주세요. (상태 코드: ${status})`);
      } else {
        alert(`리뷰 삭제 중 오류가 발생했습니다. (상태 코드: ${status || '알 수 없음'})`);
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>관리자 대시보드</h1>
          <p style={styles.subtitle}>식당과 리뷰를 관리할 수 있습니다</p>
        </div>
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏪</div>
            <div>
              <div style={styles.statValue}>{restaurants.length}</div>
              <div style={styles.statLabel}>총 식당</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <div>
              <div style={styles.statValue}>{reviews.length}</div>
              <div style={styles.statLabel}>총 리뷰</div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setTab("restaurants")}
          style={{
            ...styles.tab,
            ...(tab === "restaurants" ? styles.tabActive : {}),
          }}
        >
          🏪 식당 관리
        </button>
        <button
          onClick={() => setTab("reviews")}
          style={{
            ...styles.tab,
            ...(tab === "reviews" ? styles.tabActive : {}),
          }}
        >
          ⭐ 리뷰 관리
        </button>
      </div>

      {tab === "restaurants" && (
        <div style={styles.content}>
          {/* 상단 바 */}
          <div style={styles.toolbar}>
            <input
              placeholder="🔍 식당명, 주소, 카테고리로 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={styles.searchInput}
            />
            <button onClick={handleCreate} style={styles.createButton}>
              ✨ 식당 생성
            </button>
          </div>

          {/* 카드 그리드 */}
          <div style={styles.cardGrid}>
            {loading ? (
              <div style={styles.emptyState}>불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div style={styles.emptyState}>결과가 없습니다</div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} style={styles.restaurantCard}>
                  <div
                    style={{
                      ...styles.cardImage,
                      backgroundImage: r.imageUrl ? `url(${getFullImageUrl(r.imageUrl)})` : "none",
                    }}
                  >
                    {!r.imageUrl && (
                      <div style={styles.noImagePlaceholder}>
                        🏪
                      </div>
                    )}
                  </div>
                  <div style={styles.cardContent}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cardTitle}>{r.name}</h3>
                      <span style={styles.categoryBadge}>{r.category}</span>
                    </div>
                    <p style={styles.cardAddress}>📍 {r.address}</p>
                    <div style={styles.cardStats}>
                      <div style={styles.statItem}>
                        <span style={styles.statIcon}>⭐</span>
                        <span style={styles.statText}>
                          {r.stats?.rating?.toFixed(1) ?? "0.0"}
                        </span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.statIcon}>💬</span>
                        <span style={styles.statText}>
                          {r.stats?.reviewCount ?? 0}
                        </span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={r.isActive ? styles.activeIcon : styles.inactiveIcon}>
                          {r.isActive ? "✅" : "❌"}
                        </span>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        onClick={() => handleEdit(r)}
                        style={styles.editButton}
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={styles.deleteButton}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 모달: 생성/수정 */}
          {showForm && (
            <RestaurantForm
              mode={formMode}
              initialData={editing ?? undefined}
              onClose={() => setShowForm(false)}
              onSubmitSuccess={async (payload) => {
                try {
                  if (formMode === "create") {
                    await adminCreateRestaurant(payload);
                    alert("✅ 맛집이 성공적으로 등록되었습니다!");
                  } else if (editing) {
                    await adminUpdateRestaurant(editing.id, payload);
                    alert("✅ 맛집 정보가 성공적으로 수정되었습니다!");
                  }
                  setShowForm(false);
                  await loadRestaurants();
                } catch (e: any) {
                  console.error(e);
                  const status = e?.response?.status;
                  if (status === 409) {
                    alert("❌ 동일 이름+주소 식당이 존재합니다.");
                  } else if (status === 401 || status === 403) {
                    alert("❌ 권한이 없습니다. 관리자 계정으로 로그인해 주세요.");
                  } else {
                    alert(`❌ 저장 중 오류가 발생했습니다.\n${e.response?.data?.message || e.message}`);
                  }
                }
              }}
            />
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div style={styles.content}>
          {/* 상단 바 */}
          <div style={styles.toolbar}>
            <input
              placeholder="🔍 식당명, 작성자, 내용으로 검색..."
              value={reviewKeyword}
              onChange={(e) => setReviewKeyword(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* 리뷰 카드 그리드 */}
          <div style={styles.reviewGrid}>
            {reviewsLoading ? (
              <div style={styles.emptyState}>불러오는 중...</div>
            ) : filteredReviews.length === 0 ? (
              <div style={styles.emptyState}>결과가 없습니다</div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review._id} style={styles.reviewCard}>
                  <div style={styles.reviewHeader}>
                    <div>
                      <div style={styles.reviewRestaurant}>
                        🏪 {review.restaurantName || "-"}
                      </div>
                      <div style={styles.reviewAuthor}>
                        👤 {review.nickname || "익명"}
                      </div>
                    </div>
                    <div style={styles.reviewRating}>
                      ⭐ {review.ratings?.restaurantRating || 0}
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedReview(review)}
                    style={styles.reviewContent}
                  >
                    {review.content || "-"}
                  </div>
                  <div style={styles.reviewFooter}>
                    <div style={styles.reviewMeta}>
                      <span>❤️ {review.likeCount || 0}</span>
                      <span>
                        📅{" "}
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      style={styles.reviewDeleteButton}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 리뷰 상세 모달 */}
          {selectedReview && (
            <div onClick={() => setSelectedReview(null)} style={styles.modalOverlay}>
              <div onClick={(e) => e.stopPropagation()} style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>리뷰 상세</h2>
                  <button
                    onClick={() => setSelectedReview(null)}
                    style={styles.modalClose}
                  >
                    ×
                  </button>
                </div>

                <div style={styles.modalBody}>
                  <div style={styles.modalField}>
                    <strong>🏪 식당:</strong> {selectedReview.restaurantName || "-"}
                  </div>
                  <div style={styles.modalField}>
                    <strong>👤 작성자:</strong> {selectedReview.nickname || "익명"}
                  </div>
                  <div style={styles.modalField}>
                    <strong>⭐ 평점:</strong> {selectedReview.ratings?.restaurantRating || 0}점
                  </div>
                  <div style={styles.modalField}>
                    <strong>❤️ 좋아요:</strong> {selectedReview.likeCount || 0}
                  </div>
                  <div style={styles.modalField}>
                    <strong>📅 작성일:</strong>{" "}
                    {selectedReview.createdAt
                      ? new Date(selectedReview.createdAt).toLocaleString()
                      : "-"}
                  </div>
                  <div style={styles.modalField}>
                    <strong>내용:</strong>
                    <div style={styles.modalContentBox}>
                      {selectedReview.content || "-"}
                    </div>
                  </div>

                  {selectedReview.imageUrls && selectedReview.imageUrls.length > 0 && (
                    <div style={styles.modalField}>
                      <strong>📷 이미지:</strong>
                      <div style={styles.modalImages}>
                        {selectedReview.imageUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={getFullImageUrl(url)}
                            alt={`리뷰 이미지 ${idx + 1}`}
                            style={styles.modalImage}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.modalActions}>
                  <button
                    onClick={() => handleDeleteReview(selectedReview._id)}
                    style={styles.modalDeleteButton}
                  >
                    🗑️ 삭제
                  </button>
                  <button
                    onClick={() => setSelectedReview(null)}
                    style={styles.modalCancelButton}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "32px 16px",
  },
  header: {
    maxWidth: 1200,
    margin: "0 auto 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
  },
  title: {
    margin: 0,
    fontSize: 36,
    fontWeight: 700,
    color: "#fff",
    textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
  },
  statsContainer: {
    display: "flex",
    gap: 16,
  },
  statCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  statIcon: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#667eea",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  tabContainer: {
    maxWidth: 1200,
    margin: "0 auto 24px",
    display: "flex",
    gap: 12,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 8,
  },
  tab: {
    flex: 1,
    padding: "12px 24px",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    transition: "all 0.3s ease",
  },
  tabActive: {
    background: "#fff",
    color: "#667eea",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  toolbar: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: 250,
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    fontSize: 15,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    outline: "none",
  },
  createButton: {
    padding: "14px 28px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(245,87,108,0.4)",
    transition: "transform 0.2s ease",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 24,
  },
  restaurantCard: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  cardImage: {
    height: 180,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noImagePlaceholder: {
    fontSize: 64,
    opacity: 0.3,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#333",
    flex: 1,
  },
  categoryBadge: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  cardAddress: {
    margin: "0 0 16px",
    fontSize: 14,
    color: "#666",
  },
  cardStats: {
    display: "flex",
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "1px solid #f0f0f0",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  activeIcon: {
    fontSize: 18,
  },
  inactiveIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  cardActions: {
    display: "flex",
    gap: 8,
  },
  editButton: {
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    border: "none",
    background: "#667eea",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  deleteButton: {
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  reviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: 20,
  },
  reviewCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  reviewRestaurant: {
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    color: "#666",
  },
  reviewRating: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f59e0b",
  },
  reviewContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.6,
    marginBottom: 16,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    cursor: "pointer",
    borderLeft: "3px solid #667eea",
    paddingLeft: 12,
    background: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  reviewFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewMeta: {
    display: "flex",
    gap: 16,
    fontSize: 13,
    color: "#666",
  },
  reviewDeleteButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#fee",
    color: "#ef4444",
    fontSize: 16,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: 60,
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 16,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: 20,
    padding: 32,
    maxWidth: 600,
    width: "90%",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #f0f0f0",
  },
  modalTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#333",
  },
  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: 32,
    color: "#999",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalField: {
    marginBottom: 16,
    fontSize: 15,
    color: "#333",
  },
  modalContentBox: {
    marginTop: 8,
    padding: 16,
    background: "#f9fafb",
    borderRadius: 12,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    borderLeft: "4px solid #667eea",
    fontSize: 14,
    lineHeight: 1.6,
  },
  modalImages: {
    display: "flex",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  },
  modalImage: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalDeleteButton: {
    padding: "12px 24px",
    borderRadius: 12,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  modalCancelButton: {
    padding: "12px 24px",
    borderRadius: 12,
    border: "none",
    background: "#6b7280",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};
