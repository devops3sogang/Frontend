// 메인에 보이는 룰렛 컴포넌트

import { useState, useRef, useEffect } from 'react';
import { restaurantsData, type Restaurant, getAverageRating } from '../data/places';
import './Roulette.css';

interface RouletteProps {
  onNavigateToMap: (restaurantId: string) => void;
}

function Roulette({ onNavigateToMap }: RouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const restaurants = restaurantsData.filter(r => r.isActive);
  const colors = ['#cddafd', '#eae4e9', '#f4e1d6', '#d1e6d3', '#f0efeb', '#f3d9de', '#fff1e6', '#e2ece9', '#f1ddff', '#dfe7fd','#fde2e4'];

  // 캔버스에 룰렛 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const anglePerSlice = (2 * Math.PI) / restaurants.length;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 회전 적용
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // 각 섹션 그리기
    restaurants.forEach((restaurant, index) => {
      const startAngle = index * anglePerSlice - Math.PI / 2;
      const endAngle = startAngle + anglePerSlice;
      const color = colors[index % colors.length];

      // 섹션 그리기
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 텍스트 그리기
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(restaurant.name, radius * 0.65, 5);
      ctx.restore();
    });

    ctx.restore();

    // 중앙 원 그리기
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [rotation, restaurants]);

  const spinRoulette = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);

    // 최소 5바퀴 + 랜덤 각도
    const randomSpins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = randomSpins * 360 + randomAngle;

    // 애니메이션
    const startTime = Date.now();
    const duration = 4000; // 4초

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOut 효과
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = totalRotation * easeOut;

      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 회전 완료
        setIsSpinning(false);

        // 최종 각도 계산 (0-360 범위로 정규화)
        const finalAngle = currentRotation % 360;

        // 12시 방향을 기준으로 선택된 섹션 찾기
        const anglePerSlice = 360 / restaurants.length;
        const effectiveAngle = (360 - finalAngle) % 360;
        const selectedIndex = Math.floor(effectiveAngle / anglePerSlice);

        const selected = restaurants[selectedIndex];
        setSelectedRestaurant(selected);

        // 1초 후 결과 모달 표시
        setTimeout(() => {
          setShowResultModal(true);
        }, 1000);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="roulette-container">
      <div className="roulette-wheel-wrapper">
        <div className="roulette-pointer"></div>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="roulette-canvas"
        />
      </div>

      <button
        className={`spin-button ${isSpinning ? 'spinning' : ''}`}
        onClick={spinRoulette}
        disabled={isSpinning}
      >
        {isSpinning ? '돌리는 중...' : '룰렛 돌리기'}
      </button>

      {/* 룰렛 결과 모달 */}
      {showResultModal && selectedRestaurant && (
        <div className="roulette-result-overlay" onClick={() => setShowResultModal(false)}>
          <div className="roulette-result-container" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRestaurant.name}</h2>

            {selectedRestaurant.imageUrl && (
              <div className="result-image-wrapper">
                <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} />
              </div>
            )}

            <div className="result-rating">
              <span className="star">★</span>
              <span className="rating-value">{getAverageRating(selectedRestaurant._id).toFixed(1)}</span>
            </div>

            {selectedRestaurant.menu && selectedRestaurant.menu.length > 0 && (
              <div className="result-menu">
                <h3>메뉴</h3>
                <ul>
                  {selectedRestaurant.menu.slice(0, 5).map((item) => (
                    <li key={item.name}>
                      <span className="menu-name">{item.name}</span>
                      <span className="menu-price">{item.price.toLocaleString()}원</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="result-actions">
              <button
                className="btn-navigate"
                onClick={() => {
                  setShowResultModal(false);
                  onNavigateToMap(selectedRestaurant._id);
                }}
              >
                이동
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowResultModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roulette;
