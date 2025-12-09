import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { getRestaurants } from "../api";
import RestaurantDetail from "../components/RestaurantDetail";
import type { Restaurant } from "../data/places";
import RestaurantForm from "../components/RestaurantForm";
import { useAuth } from "../contexts/AuthContext";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 60px)", // 네비게이션 바 높이 제외
};

// 기본 위치 (서울)
const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

// 서강대학교 위치
const sogangLocation = {
  lat: 37.551105,
  lng: 126.941053,
};

function Map() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const previousMapCenter = useRef(mapCenter);

  // 필터/정렬 상태
  const [filterTypes, setFilterTypes] = useState<
    ("ON_CAMPUS" | "OFF_CAMPUS")[]
  >([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterRadius, setFilterRadius] = useState<number | null>(null); // null = 전체 거리
  const [sortBy, setSortBy] = useState<
    "DISTANCE" | "RATING" | "REVIEW_COUNT" | null
  >(null);

  // Debounced 값 - 슬라이더 드래그 중에는 API 호출 지연
  const debouncedFilterRadius = useDebounce(filterRadius, 300);

  // 토글 상태
  const [showFilters, setShowFilters] = useState(true);
  const [showRestaurantList, setShowRestaurantList] = useState(true);

  // 맛집 목록 가져오기 - 이미 저장된 currentPosition 사용
  const fetchRestaurants = useCallback(async () => {
    // 이미 저장된 위치 사용 (없으면 기본 위치)
    const position = currentPosition || defaultCenter;

    try {
      const params: any = {
        lat: position.lat,
        lng: position.lng,
      };

      // 거리 필터와 정렬 옵션을 백엔드에 전달 (debounced 값 사용)
      if (debouncedFilterRadius !== null) params.radius = debouncedFilterRadius;
      if (sortBy !== null) params.sortBy = sortBy;

      let data = await getRestaurants(params);
      console.log("백엔드에서 받은 데이터:", data.length, "개");

      // 클라이언트 측에서 OR 조건으로 필터 적용
      if (filterTypes.length > 0) {
        data = data.filter((r) => filterTypes.includes(r.type as any));
      }
      if (filterCategories.length > 0) {
        data = data.filter((r) => filterCategories.includes(r.category));
      }

      console.log("필터링 후 데이터:", data.length, "개");

      const validRestaurants = data.filter((r) => r.id || (r as any).id);
      setRestaurants(validRestaurants);
      if (validRestaurants.length < data.length) {
        console.warn(
          `${
            data.length - validRestaurants.length
          }개의 레스토랑에 id가 없어 제외되었습니다.`
        );
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [currentPosition, debouncedFilterRadius, sortBy, filterTypes, filterCategories]);

  // 초기 로딩 및 필터 조건 변경 시 검색
  useEffect(() => {
    setLoading(true);
    fetchRestaurants();
  }, [fetchRestaurants]);

  // 사용자 위치 가져오기 (항상 실행)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("현재 위치:", newPosition);
          console.log("정확도:", position.coords.accuracy, "미터");
          setCurrentPosition(newPosition);
        },
        (error) => {
          console.error("위치 정보를 가져올 수 없습니다:", error);
          console.error("에러 코드:", error.code);
          console.error("에러 메시지:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
  }, []);

  // URL 파라미터에 따라 지도 중심 설정
  useEffect(() => {
    if (restaurants.length === 0) return;

    const restaurantId = searchParams.get("restaurantId");

    if (restaurantId) {
      const restaurant = restaurants.find(
        (r: Restaurant) => r.id === restaurantId
      );
      if (restaurant) {
        const restaurantLocation = {
          lat: restaurant.location.coordinates[1],
          lng: restaurant.location.coordinates[0],
        };
        setSelectedRestaurant(restaurant);
        setMapCenter(restaurantLocation);
        return;
      }
    }

    // restaurantId가 없으면 사용자 위치를 중심으로
    if (currentPosition) {
      setMapCenter(currentPosition);
    }
  }, [searchParams, currentPosition, restaurants]);

  // mapCenter가 변경되면 지도를 해당 위치로 이동
  useEffect(() => {
    if (
      map &&
      (previousMapCenter.current.lat !== mapCenter.lat ||
        previousMapCenter.current.lng !== mapCenter.lng)
    ) {
      map.panTo(mapCenter);
      // 우측 패널(400px)을 고려해 오른쪽으로 이동
      map.panBy(+150, 0);
      previousMapCenter.current = mapCenter;
    }
  }, [mapCenter, map]);

  // ✅ 새 식당 기본값을 만드는 헬퍼 (지도 중심/현재 위치 기반 좌표)
  const makeDefaultRestaurantPayload = () => {
    const center = map
      ? (map.getCenter() as google.maps.LatLng)
      : currentPosition
      ? new google.maps.LatLng(currentPosition.lat, currentPosition.lng)
      : new google.maps.LatLng(defaultCenter.lat, defaultCenter.lng);

    const lat = center.lat();
    const lng = center.lng();

    return {
      name: "",
      type: "OFF_CAMPUS" as const,
      category: "",
      address: "",
      location: {
        type: "Point" as const,
        coordinates: [lng, lat] as [number, number], // [경도, 위도]
      },
      imageUrl: "",
      menu: [] as { name: string; price: number }[],
    };
  };

  // 카테고리 목록
  const categories = [
    "한식",
    "중식",
    "일식",
    "양식",
    "분식",
    "고깃집",
    "횟집",
    "패스트푸드",
    "치킨",
    "카페·디저트",
    "퓨전",
    "멕시칸",
    "베트남",
    "터키",
    "인도",
    "뷔페",
  ];

  // 필터 토글 핸들러
  const toggleFilterType = (type: "ON_CAMPUS" | "OFF_CAMPUS") => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleFilterCategory = (category: string) => {
    setFilterCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 필터 UI */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "300px",
          maxWidth: "300px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>필터</div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
              color: "#666",
            }}
          >
            {showFilters ? "숨기기" : "보기"}
          </button>
        </div>

        {showFilters && (
          <>
            {/* 식당 타입 - 버튼 형식 */}
            <div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => toggleFilterType("ON_CAMPUS")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: filterTypes.includes("ON_CAMPUS")
                      ? "2px solid #FFD600"
                      : "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: filterTypes.includes("ON_CAMPUS")
                      ? "#FFF8E1"
                      : "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: filterTypes.includes("ON_CAMPUS")
                      ? "bold"
                      : "normal",
                    color: filterTypes.includes("ON_CAMPUS")
                      ? "#333"
                      : "#666",
                  }}
                >
                  교내
                </button>
                <button
                  onClick={() => toggleFilterType("OFF_CAMPUS")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: filterTypes.includes("OFF_CAMPUS")
                      ? "2px solid #FFD600"
                      : "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: filterTypes.includes("OFF_CAMPUS")
                      ? "#FFF8E1"
                      : "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: filterTypes.includes("OFF_CAMPUS")
                      ? "bold"
                      : "normal",
                    color: filterTypes.includes("OFF_CAMPUS")
                      ? "#333"
                      : "#666",
                  }}
                >
                  교외
                </button>
              </div>
            </div>

            {/* 카테고리 - 버튼 형식 */}
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleFilterCategory(cat)}
                    style={{
                      padding: "6px 10px",
                      border: filterCategories.includes(cat)
                        ? "2px solid #FFD600"
                        : "1px solid #ddd",
                      borderRadius: "16px",
                      backgroundColor: filterCategories.includes(cat)
                        ? "#FFF8E1"
                        : "white",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: filterCategories.includes(cat)
                        ? "bold"
                        : "normal",
                      color: filterCategories.includes(cat)
                        ? "#333"
                        : "#666",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 거리 - 슬라이더 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <label style={{ fontSize: "12px", color: "#666" }}>
                  거리:{" "}
                  {filterRadius === null
                    ? "전체"
                    : filterRadius >= 1000
                    ? `${(filterRadius / 1000).toFixed(1)}km`
                    : `${filterRadius}m`}
                </label>
                {filterRadius !== null && (
                  <button
                    onClick={() => setFilterRadius(null)}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      border: "1px solid #ddd",
                      borderRadius: "3px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    전체
                  </button>
                )}
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={filterRadius === null ? 5000 : filterRadius}
                onChange={(e) => setFilterRadius(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "#999",
                  marginTop: "2px",
                }}
              >
                <span>100m</span>
                <span>5km</span>
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  정렬 기준
                </label>
                {sortBy !== null && (
                  <button
                    onClick={() => setSortBy(null)}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      border: "1px solid #ddd",
                      borderRadius: "3px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    초기화
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    cursor: "pointer",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor:
                      sortBy === "DISTANCE" ? "#f0f0f0" : "white",
                  }}
                >
                  <input
                    type="radio"
                    value="DISTANCE"
                    checked={sortBy === "DISTANCE"}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  />
                  <span style={{ fontSize: "13px" }}>거리순</span>
                </label>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    cursor: "pointer",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: sortBy === "RATING" ? "#f0f0f0" : "white",
                  }}
                >
                  <input
                    type="radio"
                    value="RATING"
                    checked={sortBy === "RATING"}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  />
                  <span style={{ fontSize: "13px" }}>평점순</span>
                </label>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    cursor: "pointer",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor:
                      sortBy === "REVIEW_COUNT" ? "#f0f0f0" : "white",
                  }}
                >
                  <input
                    type="radio"
                    value="REVIEW_COUNT"
                    checked={sortBy === "REVIEW_COUNT"}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  />
                  <span style={{ fontSize: "13px", wordBreak: "keep-all" }}>
                    리뷰많은순
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 식당 리스트 */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 340,
          zIndex: 10,
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          width: "320px",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>식당 목록</span>
            <span
              style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}
            >
              {restaurants.length}개
            </span>
          </div>
          <button
            onClick={() => setShowRestaurantList(!showRestaurantList)}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
              color: "#666",
            }}
          >
            {showRestaurantList ? "숨기기" : "보기"}
          </button>
        </div>

        {showRestaurantList && (
          <>
            {loading ? (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                로딩 중...
              </div>
            ) : restaurants.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                검색 결과가 없습니다
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    onClick={() => {
                      const newCenter = {
                        lat: restaurant.location.coordinates[1],
                        lng: restaurant.location.coordinates[0],
                      };
                      setSelectedRestaurant(restaurant);
                      setMapCenter(newCenter);
                    }}
                    style={{
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedRestaurant?.id === restaurant.id
                          ? "#f0f8ff"
                          : "white",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedRestaurant?.id !== restaurant.id) {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRestaurant?.id !== restaurant.id) {
                        e.currentTarget.style.backgroundColor = "white";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          flex: 1,
                        }}
                      >
                        {restaurant.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          backgroundColor: "#f0f0f0",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          whiteSpace: "nowrap",
                          marginLeft: "8px",
                        }}
                      >
                        {restaurant.category}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      <span style={{ color: "#FFA500" }}>★</span>
                      <span>
                        {restaurant.stats?.rating?.toFixed(1) ?? "0.0"}
                      </span>
                      <span>({restaurant.stats?.reviewCount ?? 0})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={15}
        onLoad={(map) => setMap(map)}
      >
        {/* 현재 위치 마커 (위치를 가져온 경우에만 표시) */}
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />
        )}

        {/* 식당 마커들 */}
        {restaurants.map((restaurant: Restaurant) => (
          <Marker
            key={restaurant.id}
            position={{
              lat: restaurant.location.coordinates[1],
              lng: restaurant.location.coordinates[0],
            }}
            onClick={() => {
              const newCenter = {
                lat: restaurant.location.coordinates[1],
                lng: restaurant.location.coordinates[0],
              };
              setSelectedRestaurant(restaurant);
              setMapCenter(newCenter); // 마커를 클릭했을 때도 mapCenter를 업데이트
            }}
          />
        ))}

        {/* 거리 필터 동심원 오버레이 */}
        {currentPosition && filterRadius !== null && (
          <Circle
            center={currentPosition}
            radius={filterRadius}
            options={{
              fillColor: "transparent",
              fillOpacity: 0,
              strokeColor: "#FFD600",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        )}

        {/* 간단한 정보 말풍선 (지도 위) */}
        {selectedRestaurant && (
          <InfoWindow
            key={selectedRestaurant.id}
            position={{
              lat: selectedRestaurant.location.coordinates[1],
              lng: selectedRestaurant.location.coordinates[0],
            }}
            onCloseClick={() => setSelectedRestaurant(null)}
          >
            <div style={{ padding: "10px" }}>
              <h3
                style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#333" }}
              >
                {selectedRestaurant.name}
              </h3>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span style={{ color: "#FFA500", fontSize: "18px" }}>★</span>
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {selectedRestaurant.stats?.rating?.toFixed(1) ?? "0.0"}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* 위치 이동 버튼들 */}
      <div
        style={{
          position: "absolute",
          right: selectedRestaurant ? 420 : 20,
          bottom: 100,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "right 0.3s ease",
        }}
      >
        {/* 내 위치로 이동 */}
        <button
          onClick={() => {
            if (currentPosition) {
              setMapCenter(currentPosition);
              map?.panTo(currentPosition);
            } else {
              alert("현재 위치를 가져올 수 없습니다.");
            }
          }}
          style={{
            width: "44px",
            height: "44px",
            border: "none",
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
          title="내 위치로 이동"
        >
          📍
        </button>

        {/* 서강대로 이동 */}
        <button
          onClick={() => {
            setMapCenter(sogangLocation);
            map?.panTo(sogangLocation);
          }}
          style={{
            width: "44px",
            height: "44px",
            border: "none",
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
          title="서강대로 이동"
        >
          🏫
        </button>
      </div>

      {/* 우측 상세 정보 패널 */}
      {selectedRestaurant && (
        <RestaurantDetail
          key={selectedRestaurant.id}
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onDataChange={() => {
            // 데이터 변경 시 식당 목록 갱신
            fetchRestaurants();
          }}
        />
      )}

      {/* ✅ 관리자 전용 플로팅 버튼 */}
      {user?.role === "ADMIN" && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            position: "absolute",
            left: 24,
            bottom: 24,
            zIndex: 5,
            border: "none",
            borderRadius: "9999px",
            padding: "12px 16px",
            fontSize: 16,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          + 맛집 등록
        </button>
      )}

      {/* ✅ 생성 모달: RestaurantForm (mode="create") */}
      {showCreateForm && (
        <RestaurantForm
          mode="create"
          initialData={makeDefaultRestaurantPayload() as any}
          onClose={() => setShowCreateForm(false)}
          onSubmitSuccess={async (payload) => {
            try {
              // 관리자 API로 식당 생성
              const { adminCreateRestaurant } = await import("../api");
              await adminCreateRestaurant(payload);
              alert("✅ 맛집이 성공적으로 등록되었습니다!");
              setShowCreateForm(false);
              await fetchRestaurants(); // 생성 후 목록 갱신
            } catch (error: any) {
              console.error("맛집 등록 실패:", error);
              alert(
                `❌ 맛집 등록에 실패했습니다.\n${
                  error.response?.data?.message || error.message
                }`
              );
            }
          }}
        />
      )}
    </div>
  );
}

export default Map;
