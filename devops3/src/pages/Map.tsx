import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { restaurantsData, getAverageRating } from '../data/places';
import RestaurantDetail from '../components/RestaurantDetail';
import type { Restaurant } from '../data/places';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 60px)' // 네비게이션 바 높이 제외
};

// 기본 위치 (서울)
const defaultCenter = {
  lat: 37.5665,
  lng: 126.9780
};

function Map() {
  const [searchParams] = useSearchParams();
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const restaurantId = searchParams.get('restaurantId');

    // 1. URL에 restaurantId가 있는지 먼저 확인
    if (restaurantId) {
      const restaurant = restaurantsData.find(r => r._id === restaurantId);
      if (restaurant) {
        const restaurantLocation = {
          lat: restaurant.location.coordinates[1],
          lng: restaurant.location.coordinates[0] + 0.008
        };
        setSelectedRestaurant(restaurant);
        setMapCenter(restaurantLocation);
        // restaurantId가 있으면 사용자 위치는 가져오지 않고 여기서 종료
        return;
      }
    }

    // 2. restaurantId가 없을 경우에만 사용자 현재 위치를 가져옴
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(newPosition);
          setMapCenter(newPosition);
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          // 위치 정보 가져오기 실패 시 기본 위치(서울)를 중심으로 설정
          setMapCenter(defaultCenter);
        }
      );
    } else {
      console.error('이 브라우저는 위치 정보를 지원하지 않습니다.');
      setMapCenter(defaultCenter);
    }
  }, [searchParams]);

  // mapCenter가 변경되면 지도를 해당 위치로 이동
  useEffect(() => {
    if (map) {
      map.panTo(mapCenter);
      // 우측 패널 너비만큼 왼쪽으로 이동 (픽셀 기반)
        map.panBy(150, 0);
    }
  }, [mapCenter, map]);

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={15}
        onLoad={(map) => setMap(map)}
      >
        {/* 현재 위치 마커 */}
        <Marker
          position={currentPosition}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }}
        />

        {/* 식당 마커들 */}
        {restaurantsData.map((restaurant) => (
          <Marker
            key={restaurant._id}
            position={{
              lat: restaurant.location.coordinates[1],
              lng: restaurant.location.coordinates[0]
            }}
            onClick={() => {
              const newCenter = {
                lat: restaurant.location.coordinates[1],
                lng: restaurant.location.coordinates[0]
              };
              setSelectedRestaurant(restaurant);
              setMapCenter(newCenter); // 마커를 클릭했을 때도 mapCenter를 업데이트
            }}
          />
        ))}

        {/* 간단한 정보 말풍선 (지도 위) */}
        {selectedRestaurant && (
          <InfoWindow
            position={{
              lat: selectedRestaurant.location.coordinates[1],
              lng: selectedRestaurant.location.coordinates[0]
            }}
            onCloseClick={() => setSelectedRestaurant(null)}
          >
            <div style={{ padding: '10px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                {selectedRestaurant.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#FFA500', fontSize: '18px' }}>★</span>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {getAverageRating(selectedRestaurant._id).toFixed(1)}
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
    </div>
  );
}

export default Map;
