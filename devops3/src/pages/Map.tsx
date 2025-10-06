import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
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
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    // 사용자의 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
        }
      );
    } else {
      console.error('이 브라우저는 위치 정보를 지원하지 않습니다.');
    }
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentPosition}
          zoom={13}
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
              key={restaurant.idx}
              position={{ lat: restaurant.lat, lng: restaurant.lng }}
              onClick={() => setSelectedRestaurant(restaurant)}
            />
          ))}

          {/* 간단한 정보 말풍선 (지도 위) */}
          {selectedRestaurant && (
            <InfoWindow
              position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
              onCloseClick={() => setSelectedRestaurant(null)}
            >
              <div style={{ padding: '10px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                  {selectedRestaurant.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#FFA500', fontSize: '18px' }}>★</span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {getAverageRating(selectedRestaurant.idx).toFixed(1)}
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

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
