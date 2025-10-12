# Frontend 개발 가이드

DevOps 프로젝트의 프론트엔드 애플리케이션입니다. React + TypeScript + Vite 기반으로 구축되었습니다.

## 기술 스택

- **React 19** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 및 개발 서버
- **React Router DOM** - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트
- **Google Maps API** - 지도 기능

## 사전 요구사항

- **Node.js** 18.x 이상
- **npm** 또는 **yarn**
- Google Maps API 키 (선택사항, 지도 기능 사용 시 필요)

## 프로젝트 구조

프로젝트 구조 왜이런가요: 제가 리액트는 처음이라...

```
Frontend/devops3/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── contexts/       # React Context (AuthContext 등)
│   ├── pages/          # 페이지 컴포넌트
│   ├── App.tsx         # 메인 앱 컴포넌트
│   └── main.tsx        # 진입점
├── public/             # 정적 파일
├── .env                # 환경 변수
└── package.json        # 프로젝트 의존성
```

## 설치 및 실행

### 1. 프로젝트 디렉토리로 이동

```bash
cd Frontend/devops3
```

### 2. 의존성 설치

```bash
npm install
```

또는 yarn 사용 시:

```bash
yarn install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일이 있는지 확인합니다. 없다면 생성하세요:

```bash
# .env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_BASE_URL=http://localhost:8080/api
```

**주요 환경 변수:**

- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API 키 (지도 기능 사용 시 필수)
- `VITE_API_BASE_URL`: 백엔드 API 서버 주소 (기본값: http://localhost:8080/api)

### 4. 개발 서버 실행

```bash
npm run dev
```

또는 yarn 사용 시:

```bash
yarn dev
```

개발 서버가 시작되면 브라우저에서 다음 주소로 접속하세요:

```
http://localhost:8282
```

## 사용 가능한 스크립트

| 명령어            | 설명                                         |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | 개발 서버 시작 (Hot Module Replacement 지원) |
| `npm run build`   | TypeScript 컴파일 후 프로덕션 빌드 생성      |
| `npm run preview` | 프로덕션 빌드를 로컬에서 미리보기            |
| `npm run lint`    | ESLint로 코드 검사                           |

## 주요 페이지 및 라우트

애플리케이션은 다음과 같은 페이지로 구성되어 있습니다:

- `/` - 홈 페이지
- `/map` - 지도 페이지 (Google Maps API 사용)
- `/login` - 로그인 페이지
- `/signup` - 회원가입 페이지
- `/mypage` - 마이페이지

## 백엔드 연동

백엔드 API와 연동하려면 백엔드 서버가 먼저 실행되어 있어야 합니다.

1. 백엔드 서버가 `http://localhost:8080`에서 실행 중인지 확인
2. `.env` 파일의 `VITE_API_BASE_URL`이 올바르게 설정되었는지 확인
3. 프론트엔드 개발 서버 실행
