import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { getRestaurants } from "../api";
import RestaurantDetail from "../components/RestaurantDetail";
import type { Restaurant } from "../data/places";
import RestaurantForm from "../components/RestaurantForm";
import { useAuth } from "../contexts/AuthContext";

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 60px)", // 네비게이션 바 높이 제외
};

// 기본 위치 (서울)
const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
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

  // 맛집 목록 가져오기
  const fetchRestaurants = async () => {
    try {
      // 사용자 위치 가져오기
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await getRestaurants({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            console.log("API Response:", data[0]);
            const validRestaurants = data.filter((r) => r.id || (r as any).id);
            setRestaurants(validRestaurants);
            if (validRestaurants.length < data.length) {
              console.warn(`${data.length - validRestaurants.length}개의 레스토랑에 id가 없어 제외되었습니다.`);
            }
          } catch (error) {
            console.error("Failed to fetch restaurants:", error);
            setRestaurants([]);
          } finally {
            setLoading(false);
          }
        },
        async (error) => {
          console.error("위치 정보를 가져올 수 없습니다:", error);
          // 기본 위치 (서울) 사용
          try {
            const data = await getRestaurants({
              lat: defaultCenter.lat,
              lng: defaultCenter.lng,
            });
            console.log("API Response:", data[0]);
            const validRestaurants = data.filter((r) => r.id || (r as any).id);
            setRestaurants(validRestaurants);
            if (validRestaurants.length < data.length) {
              console.warn(`${data.length - validRestaurants.length}개의 레스토랑에 id가 없어 제외되었습니다.`);
            }
          } catch (error) {
            console.error("Failed to fetch restaurants:", error);
            setRestaurants([]);
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error("Failed to initialize geolocation:", error);
      setRestaurants([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRestaurants();
  }, []);

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
    if (map) {
      map.panTo(mapCenter);
      // 우측 패널(400px)을 고려해 오른쪽으로 이동
      map.panBy(+150, 0);
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 60px)",
        }}
      >
        <p>맛집 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
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

      {/* 우측 상세 정보 패널 */}
      {selectedRestaurant && (
        <RestaurantDetail
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
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
          onSubmitSuccess={async () => {
            setShowCreateForm(false);
            await fetchRestaurants(); // 생성 후 목록 갱신
          }}
        />
      )}
    </div>
  );
}

export default Map;
