# Docker 배포 가이드

DevOps 프로젝트를 Docker와 Docker Compose를 사용하여 배포하는 가이드입니다.

## 아키텍처 구성

```
┌─────────────────────────────────────────────────┐
│              Docker Network (devops-network)     │
│                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌──────┐ │
│  │  Frontend   │──>│   Backend    │──>│ Mongo│ │
│  │   (Nginx)   │   │ (Spring Boot)│   │  DB  │ │
│  │   Port 80   │   │  Port 8080   │   │27017 │ │
│  └─────────────┘   └──────────────┘   └──────┘ │
│         │                                        │
└─────────┼────────────────────────────────────────┘
          │
    사용자 접속
   (http://localhost)
```

## 구성 요소

### 1. MongoDB (mongodb)
- 이미지: `mongo:7.0`
- 포트: `27017`
- 역할: 데이터베이스
- 데이터 볼륨: `mongodb_data`

### 2. Backend (backend)
- 빌드: Spring Boot (Java 22)
- 포트: `8080`
- 역할: REST API 서버
- 의존성: MongoDB

### 3. Frontend (frontend)
- 빌드: React + Vite + Nginx
- 포트: `80` (HTTP), `443` (HTTPS)
- 역할: 정적 파일 서빙 및 API 프록시
- 의존성: Backend

## 사전 요구사항

### 필수 설치 항목
- **Docker** 20.10 이상
- **Docker Compose** 2.0 이상

### 설치 확인

```bash
docker --version
docker compose version
```

## 빠른 시작

### 1. 프로젝트 루트로 이동

```bash
cd Team
```

### 2. 환경 변수 설정 (선택사항)

Google Maps API 키가 있다면 `.env` 파일을 생성하세요:

```bash
# .env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. 전체 애플리케이션 실행

```bash
docker compose up -d
```

이 명령어는 다음을 수행합니다:
1. MongoDB 컨테이너 시작
2. Backend 빌드 및 실행 (MongoDB 준비 완료 대기)
3. Frontend 빌드 및 실행 (Backend 준비 완료 대기)

### 4. 접속

브라우저에서 다음 주소로 접속:
```
http://localhost
```

API 문서 (Swagger UI):
```
http://localhost/api/swagger-ui/index.html
```

## 상세 명령어

### 컨테이너 상태 확인

```bash
docker compose ps
```

출력 예시:
```
NAME                IMAGE                 STATUS              PORTS
devops-frontend     devops-frontend       Up 2 minutes        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
devops-backend      devops-backend        Up 3 minutes        0.0.0.0:8080->8080/tcp
devops-mongodb      mongo:7.0             Up 4 minutes        0.0.0.0:27017->27017/tcp
```

### 로그 확인

전체 로그:
```bash
docker compose logs -f
```

특정 서비스 로그:
```bash
# 프론트엔드 로그
docker compose logs -f frontend

# 백엔드 로그
docker compose logs -f backend

# MongoDB 로그
docker compose logs -f mongodb
```

### 컨테이너 재시작

특정 서비스 재시작:
```bash
docker compose restart backend
```

전체 재시작:
```bash
docker compose restart
```

### 컨테이너 중지

```bash
docker compose stop
```

### 컨테이너 중지 및 삭제

```bash
docker compose down
```

### 컨테이너 및 볼륨 모두 삭제

```bash
docker compose down -v
```

⚠️ **주의**: 이 명령어는 MongoDB 데이터도 삭제합니다!

## 개발 모드

### 특정 서비스만 실행

프론트엔드 개발 시 (로컬에서 npm run dev 사용):
```bash
# 백엔드와 DB만 실행
docker compose up -d backend mongodb
```

백엔드 개발 시:
```bash
# MongoDB만 실행
docker compose up -d mongodb
```

### 이미지 재빌드

코드 변경 후 이미지를 재빌드:
```bash
# 전체 재빌드
docker compose build

# 특정 서비스만 재빌드
docker compose build backend

# 캐시 없이 재빌드
docker compose build --no-cache
```

재빌드 후 재시작:
```bash
docker compose up -d --build
```

## 개별 컨테이너 접근

### Backend 컨테이너 접속

```bash
docker exec -it devops-backend sh
```

### MongoDB 접속

```bash
docker exec -it devops-mongodb mongosh
```

MongoDB 쉘에서:
```javascript
// 데이터베이스 선택
use campus_food

// 컬렉션 확인
show collections

// 사용자 조회
db.users.find().pretty()

// 맛집 조회
db.restaurants.find().pretty()
```

### Frontend 컨테이너 접속

```bash
docker exec -it devops-frontend sh
```

## 환경 변수 설정

### Backend 환경 변수

[docker-compose.yml](docker-compose.yml)의 backend 섹션에서 수정:

```yaml
backend:
  environment:
    # MongoDB 연결 (기본값: mongodb://mongodb:27017/campus_food)
    SPRING_DATA_MONGODB_URI: mongodb://mongodb:27017/campus_food

    # JWT 시크릿 키 (프로덕션에서는 반드시 변경!)
    JWT_SECRET: your-super-secret-key-here
```

### Frontend 환경 변수

[docker-compose.yml](docker-compose.yml)의 frontend 섹션에서 수정:

```yaml
frontend:
  build:
    args:
      # Google Maps API 키
      VITE_GOOGLE_MAPS_API_KEY: ${VITE_GOOGLE_MAPS_API_KEY:-}
```

## 포트 변경

기본 포트를 변경하려면 [docker-compose.yml](docker-compose.yml) 수정:

```yaml
services:
  frontend:
    ports:
      - "8080:80"      # 호스트:컨테이너
      - "8443:443"

  backend:
    ports:
      - "9090:8080"

  mongodb:
    ports:
      - "27018:27017"
```

## 헬스 체크

각 서비스는 헬스 체크를 포함하고 있습니다:

```bash
# 헬스 체크 상태 확인
docker compose ps

# 상세 헬스 체크 정보
docker inspect devops-backend --format='{{json .State.Health}}' | jq
```

## 트러블슈팅

### 1. 포트가 이미 사용 중인 경우

```bash
# 포트 사용 확인 (Windows)
netstat -ano | findstr :80
netstat -ano | findstr :8080

# 포트 사용 확인 (Linux/Mac)
lsof -i :80
lsof -i :8080

# 해결: docker-compose.yml에서 포트 변경
```

### 2. 빌드 실패

```bash
# 캐시 삭제 후 재빌드
docker compose build --no-cache

# 이전 컨테이너 및 이미지 삭제
docker compose down --rmi all
docker compose up -d --build
```

### 3. Backend가 MongoDB에 연결 실패

```bash
# MongoDB 컨테이너 상태 확인
docker compose logs mongodb

# 네트워크 확인
docker network inspect team_devops-network

# MongoDB 연결 테스트
docker exec -it devops-backend sh
wget -O- http://mongodb:27017
```

### 4. Frontend에서 Backend API 호출 실패

```bash
# Nginx 설정 확인
docker exec -it devops-frontend cat /etc/nginx/conf.d/default.conf

# Backend 연결 테스트
docker exec -it devops-frontend wget -O- http://backend:8080/api/swagger-ui/index.html
```

### 5. 디스크 공간 부족

```bash
# 사용하지 않는 컨테이너, 이미지, 볼륨 삭제
docker system prune -a --volumes
```

## 데이터 백업 및 복원

### MongoDB 백업

```bash
# 백업 생성
docker exec devops-mongodb mongodump --db campus_food --out /tmp/backup

# 백업 파일을 호스트로 복사
docker cp devops-mongodb:/tmp/backup ./mongodb_backup
```

### MongoDB 복원

```bash
# 백업 파일을 컨테이너로 복사
docker cp ./mongodb_backup devops-mongodb:/tmp/backup

# 복원
docker exec devops-mongodb mongorestore --db campus_food /tmp/backup/campus_food
```

## 프로덕션 배포 체크리스트

- [ ] JWT_SECRET을 안전한 랜덤 문자열로 변경
- [ ] MongoDB에 인증 추가 (username/password)
- [ ] HTTPS 인증서 설정 (Let's Encrypt 등)
- [ ] 환경 변수를 `.env` 파일로 분리 (버전 관리에서 제외)
- [ ] Nginx 보안 헤더 확인
- [ ] 로그 볼륨 설정
- [ ] 리소스 제한 설정 (CPU, Memory)
- [ ] 모니터링 및 알림 설정

## 참고 문서

- [Frontend README](Frontend/README.md)
- [Backend README](Backend/README.md)
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)

## 문의

문제가 발생하면 팀원에게 문의하거나 이슈를 등록해주세요.
