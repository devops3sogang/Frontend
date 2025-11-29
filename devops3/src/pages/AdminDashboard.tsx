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

type Tab = "restaurants" | "reviews"; // reviews 탭은 UI만 자리 잡아두고 후속 구현

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
      // 관리자는 모든 식당을 보기 위해 서강대 중심 좌표 사용 + 반경 크게 설정
      const list = await getRestaurants({
        lat: 37.5511, // 서강대 위도
        lng: 126.9418, // 서강대 경도
        radius: 50000, // 50km (매우 넓은 범위)
        sortBy: "NONE",
      });
      console.log("Loaded restaurants:", list);
      // 백엔드 응답을 프론트엔드 타입으로 변환
      const mapped = list.map(mapBackendRestaurant);
      setRestaurants(mapped);
    } catch (e: any) {
      console.error("Failed to load restaurants:", e);
      console.error("Error response:", e.response);
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
      console.log("Loaded reviews:", list);
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
      alert("리뷰가 삭제되었습니다.");
    } catch (e: any) {
      console.error("리뷰 삭제 에러:", e);
      console.error("에러 응답:", e?.response);
      console.error("에러 데이터:", e?.response?.data);
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        alert(`권한이 없습니다. 관리자 계정으로 로그인해 주세요. (상태 코드: ${status})`);
      } else {
        alert(`리뷰 삭제 중 오류가 발생했습니다. (상태 코드: ${status || '알 수 없음'})`);
      }
    }
  };

  return (
    <div style={{ maxWidth: 1080, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>관리자 대시보드</h1>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab("restaurants")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: tab === "restaurants" ? "#222" : "#fff",
            color: tab === "restaurants" ? "#fff" : "#222",
            cursor: "pointer",
          }}
        >
          식당 관리
        </button>
        <button
          onClick={() => setTab("reviews")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: tab === "reviews" ? "#222" : "#fff",
            color: tab === "reviews" ? "#fff" : "#222",
            cursor: "pointer",
          }}
        >
          리뷰 관리
        </button>
      </div>

      {tab === "restaurants" && (
        <>
          {/* 상단 바 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <input
              placeholder="식당명/주소/카테고리 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
            <button
              onClick={handleCreate}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#111827",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              + 식당 생성
            </button>
          </div>

          {/* 목록 */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  <th style={th}>이름</th>
                  <th style={th}>카테고리</th>
                  <th style={th}>주소</th>
                  <th style={th}>평점</th>
                  <th style={th}>리뷰수</th>
                  <th style={th}>활성</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={td} colSpan={7}>
                      불러오는 중…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={7}>
                      결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td style={td}>{r.name}</td>
                      <td style={td}>{r.category}</td>
                      <td style={td}>{r.address}</td>
                      <td style={td}>{r.stats?.rating?.toFixed(1) ?? "0.0"}</td>
                      <td style={td}>{r.stats?.reviewCount ?? 0}</td>
                      <td style={td}>{r.isActive ? "✅" : "❌"}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleEdit(r)}
                            style={btn}
                            title="수정"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            style={{ ...btn, background: "#ef4444" }}
                            title="삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  } else if (editing) {
                    await adminUpdateRestaurant(editing.id, payload);
                  }
                  setShowForm(false);
                  await loadRestaurants();
                } catch (e: any) {
                  console.error(e);
                  const status = e?.response?.status;
                  if (status === 409) {
                    alert("동일 이름+주소 식당이 존재합니다.");
                  } else if (status === 401 || status === 403) {
                    alert("권한이 없습니다. 관리자 계정으로 로그인해 주세요.");
                  } else {
                    alert("저장 중 오류가 발생했습니다.");
                  }
                }
              }}
            />
          )}
        </>
      )}

      {tab === "reviews" && (
        <>
          {/* 상단 바 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <input
              placeholder="식당명/작성자/내용 검색"
              value={reviewKeyword}
              onChange={(e) => setReviewKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </div>

          {/* 목록 */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  <th style={th}>식당</th>
                  <th style={th}>작성자</th>
                  <th style={th}>평점</th>
                  <th style={th}>내용</th>
                  <th style={th}>좋아요</th>
                  <th style={th}>작성일</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {reviewsLoading ? (
                  <tr>
                    <td style={td} colSpan={7}>
                      불러오는 중…
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={7}>
                      결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review._id}>
                      <td style={td}>{review.restaurantName || "-"}</td>
                      <td style={td}>{review.nickname || "익명"}</td>
                      <td style={td}>
                        {review.ratings?.restaurantRating || 0}점
                      </td>
                      <td style={td}>
                        <div
                          onClick={() => setSelectedReview(review)}
                          style={{
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            color: "#2563eb",
                            textDecoration: "underline",
                          }}
                          title="클릭하여 전체 내용 보기"
                        >
                          {review.content || "-"}
                        </div>
                      </td>
                      <td style={td}>{review.likeCount || 0}</td>
                      <td style={td}>
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={td}>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          style={{ ...btn, background: "#ef4444" }}
                          title="삭제"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 리뷰 상세 모달 */}
          {selectedReview && (
            <div
              onClick={() => setSelectedReview(null)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  maxWidth: 600,
                  width: "90%",
                  maxHeight: "80vh",
                  overflow: "auto",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ margin: 0 }}>리뷰 상세</h2>
                  <button
                    onClick={() => setSelectedReview(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 24,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <strong>식당:</strong> {selectedReview.restaurantName || "-"}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>작성자:</strong> {selectedReview.nickname || "익명"}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>평점:</strong> {selectedReview.ratings?.restaurantRating || 0}점
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>좋아요:</strong> {selectedReview.likeCount || 0}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>작성일:</strong>{" "}
                  {selectedReview.createdAt
                    ? new Date(selectedReview.createdAt).toLocaleString()
                    : "-"}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>내용:</strong>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: "#f9fafb",
                      borderRadius: 8,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedReview.content || "-"}
                  </div>
                </div>

                {selectedReview.imageUrls && selectedReview.imageUrls.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>이미지:</strong>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      {selectedReview.imageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`리뷰 이미지 ${idx + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setSelectedReview(null);
                      handleDeleteReview(selectedReview._id);
                    }}
                    style={{
                      ...btn,
                      background: "#ef4444",
                    }}
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setSelectedReview(null)}
                    style={{
                      ...btn,
                      background: "#6b7280",
                    }}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
  fontSize: 14,
  color: "#555",
};

const td: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 14,
  color: "#333",
  verticalAlign: "top",
};

const btn: React.CSSProperties = {
  border: "none",
  background: "#111827",
  color: "#fff",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
};
