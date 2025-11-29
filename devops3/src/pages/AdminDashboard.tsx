import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getRestaurants,
  adminDeleteRestaurant,
  adminUpdateRestaurant,
  adminCreateRestaurant,
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

  useEffect(() => {
    if (user?.role?.toUpperCase() === "ADMIN") {
      loadRestaurants();
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
          리뷰 관리 (준비중)
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
        <div
          style={{
            border: "1px dashed #ddd",
            padding: 24,
            borderRadius: 12,
            color: "#777",
          }}
        >
          리뷰 목록/삭제/신고처리 UI는 후속으로 붙일게요 ✨
        </div>
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
