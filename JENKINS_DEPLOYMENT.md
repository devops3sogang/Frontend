# Jenkins CI/CD 배포 가이드

Jenkins를 사용하여 Frontend와 Backend를 자동으로 빌드하고 배포하는 가이드입니다.

## 목차

1. [배포 아키텍처](#배포-아키텍처)
2. [Jenkins 서버 설정](#jenkins-서버-설정)
3. [배포 대상 서버 설정](#배포-대상-서버-설정)
4. [Jenkins 파이프라인 설정](#jenkins-파이프라인-설정)
5. [배포 순서](#배포-순서)
6. [트러블슈팅](#트러블슈팅)

## 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Jenkins Server                           │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │  Frontend Pipeline   │      │  Backend Pipeline    │        │
│  │  (Jenkinsfile)       │      │  (Jenkinsfile)       │        │
│  └──────────┬───────────┘      └──────────┬───────────┘        │
│             │                              │                     │
│             │    1. Git Checkout           │                     │
│             │    2. Docker Build           │                     │
│             │    3. Push to DockerHub      │                     │
│             │    4. SSH Deploy             │                     │
│             └──────────────┬───────────────┘                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  DockerHub     │
                    │  (Registry)    │
                    └────────┬───────┘
                             │
                             ▼
          ┌──────────────────────────────────────────┐
          │      Deployment Server (EC2)             │
          │                                          │
          │  Docker Network (devops-network)         │
          │  ┌────────┐  ┌─────────┐  ┌──────────┐ │
          │  │MongoDB │  │ Backend │  │ Frontend │ │
          │  │ :27017 │  │  :8080  │  │  :8282   │ │
          │  └────────┘  └─────────┘  └──────────┘ │
          └──────────────────────────────────────────┘
```

## Jenkins 서버 설정

### 1. 필수 플러그인 설치

Jenkins 관리 > 플러그인 관리에서 다음을 설치:

- **Docker Pipeline** - Docker 빌드/푸시 기능
- **SSH Agent** - SSH 연결 기능
- **Git** - Git 저장소 연동
- **Credentials Binding** - 환경 변수로 자격증명 사용

### 2. Credentials 등록

**Jenkins 관리 > Credentials > System > Global credentials**에서 다음을 등록:

#### a. DockerHub Credentials

- **Kind**: Username with password
- **ID**: `dockerhub-credentials`
- **Username**: DockerHub 사용자명
- **Password**: DockerHub 비밀번호

#### b. SSH Credentials (배포 서버 접속용)

- **Kind**: SSH Username with private key
- **ID**: `admin`
- **Username**: `ubuntu` (EC2 기본값)
- **Private Key**: EC2 인스턴스의 .pem 키 파일 내용

#### c. Google Maps API Key (Frontend용)

- **Kind**: Secret text
- **ID**: `google-maps-api-key`
- **Secret**: Google Maps API 키

#### d. JWT Secret (Backend용)

- **Kind**: Secret text
- **ID**: `jwt-secret`
- **Secret**: JWT 시크릿 키 (최소 32자 이상의 랜덤 문자열)

### 3. Jenkins에 Docker 설치

Jenkins 서버에서:

```bash
# Docker 설치 (Ubuntu 기준)
sudo apt-get update
sudo apt-get install -y docker.io

# Jenkins 사용자에게 Docker 권한 부여
sudo usermod -aG docker jenkins

# Jenkins 재시작
sudo systemctl restart jenkins
```

## 배포 대상 서버 설정

### 1. Docker 설치

```bash
# Docker 설치
sudo apt-get update
sudo apt-get install -y docker.io

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Docker 서비스 시작
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Docker 네트워크 생성

프론트엔드와 백엔드가 통신할 수 있도록 같은 네트워크에 연결:

```bash
docker network create devops-network
```

### 3. MongoDB 컨테이너 실행

백엔드가 연결할 MongoDB를 먼저 실행:

```bash
docker run -d \
  --name mongodb \
  --network devops-network \
  --restart unless-stopped \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  -e MONGO_INITDB_DATABASE=campus_food \
  mongo:7.0
```

### 4. 보안 그룹 설정 (AWS EC2)

EC2 인스턴스의 보안 그룹에서 다음 포트 열기:

| 포트  | 프로토콜 | 용도                             |
| ----- | -------- | -------------------------------- |
| 22    | TCP      | SSH (Jenkins에서 배포용)         |
| 80    | TCP      | HTTP (선택사항)                  |
| 8080  | TCP      | Backend API                      |
| 8282  | TCP      | Frontend                         |
| 8443  | TCP      | HTTPS (선택사항)                 |
| 27017 | TCP      | MongoDB (로컬만, 외부 차단 권장) |

## Jenkins 파이프라인 설정

### 1. Frontend 파이프라인 생성

1. Jenkins 대시보드 > **새로운 Item**
2. 이름: `Frontend-Pipeline`
3. 타입: **Pipeline** 선택
4. 설정:

   - **Pipeline section**
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/devops3sogang/Frontend.git`
   - **Branch**: `*/master`
   - **Script Path**: `devops3/Jenkinsfile`

5. **저장**

### 2. Backend 파이프라인 생성

1. Jenkins 대시보드 > **새로운 Item**
2. 이름: `Backend-Pipeline`
3. 타입: **Pipeline** 선택
4. 설정:

   - **Pipeline section**
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/devops3sogang/Backend.git`
   - **Branch**: `*/master`
   - **Script Path**: `Jenkinsfile`

5. **저장**

### 3. Jenkinsfile 환경 변수 수정

각 Jenkinsfile에서 환경에 맞게 수정:

#### Frontend Jenkinsfile 수정 사항

```groovy
environment {
    IMAGE_NAME = 'your-dockerhub-username/frontend-app'  // DockerHub 계정명
    REMOTE_HOST = 'your-ec2-ip'                          // EC2 IP 주소
    PORT = '8282'                                         // 원하는 포트
}
```

#### Backend Jenkinsfile 수정 사항

```groovy
environment {
    IMAGE_NAME = 'your-dockerhub-username/backend-app'   // DockerHub 계정명
    REMOTE_HOST = 'your-ec2-ip'                          // EC2 IP 주소
    PORT = '8080'                                         // 원하는 포트
    MONGODB_HOST = 'mongodb'                              // MongoDB 컨테이너 이름
}
```

## 배포 순서

### 최초 배포 시

1. **MongoDB 실행** (배포 대상 서버에서)

   ```bash
   docker run -d --name mongodb --network devops-network -p 27017:27017 -v mongodb_data:/data/db mongo:7.0
   ```

2. **Backend 배포** (Jenkins)

   - Jenkins > Backend-Pipeline > **Build Now**
   - 빌드 완료 대기 (약 5-10분)
   - 로그 확인: Console Output

3. **Frontend 배포** (Jenkins)
   - Jenkins > Frontend-Pipeline > **Build Now**
   - 빌드 완료 대기 (약 3-5분)
   - 로그 확인: Console Output

### 일반 배포 (코드 변경 시)

프론트엔드나 백엔드 코드를 변경하고 GitHub에 push하면:

1. 변경된 서비스의 파이프라인만 실행

   - Frontend 변경: Frontend-Pipeline 빌드
   - Backend 변경: Backend-Pipeline 빌드
   - 둘 다 변경: 순서대로 빌드 (Backend → Frontend)

2. 자동으로 다음 작업 수행:
   - ✅ GitHub에서 최신 코드 체크아웃
   - ✅ Docker 이미지 빌드
   - ✅ DockerHub에 이미지 푸시
   - ✅ 배포 서버에서 이전 컨테이너 중지/삭제
   - ✅ 새 이미지로 컨테이너 실행
   - ✅ 헬스 체크

### 자동 배포 설정 (선택사항)

GitHub webhook을 설정하면 코드 push 시 자동으로 빌드:

1. Jenkins 파이프라인 설정 > **Build Triggers**
2. **GitHub hook trigger for GITScm polling** 체크
3. GitHub 저장소 > Settings > Webhooks > Add webhook
   - Payload URL: `http://jenkins-server:8080/github-webhook/`
   - Content type: `application/json`
   - Events: `Just the push event`

## 파이프라인 단계 설명

### Frontend Pipeline

| Stage                  | 설명                              |
| ---------------------- | --------------------------------- |
| **Checkout**           | GitHub에서 최신 코드 가져오기     |
| **Build Docker Image** | React 앱 빌드 + Nginx 이미지 생성 |
| **Push to DockerHub**  | 이미지를 DockerHub에 업로드       |
| **Deploy to Server**   | SSH로 서버 접속하여 컨테이너 교체 |
| **Health Check**       | HTTP 요청으로 정상 작동 확인      |

### Backend Pipeline

| Stage                  | 설명                                  |
| ---------------------- | ------------------------------------- |
| **Checkout**           | GitHub에서 최신 코드 가져오기         |
| **Build Docker Image** | Spring Boot 앱 빌드 + JRE 이미지 생성 |
| **Push to DockerHub**  | 이미지를 DockerHub에 업로드           |
| **Deploy to Server**   | SSH로 서버 접속하여 컨테이너 교체     |
| **Health Check**       | Swagger UI 접속으로 정상 작동 확인    |

## 배포 확인

### Frontend 접속

```bash
# 브라우저에서
http://your-ec2-ip:8282
```

### Backend API 확인

```bash
# Swagger UI
http://your-ec2-ip:8080/api/swagger-ui/index.html

# 헬스체크 (터미널)
curl http://your-ec2-ip:8080/api/swagger-ui/index.html
```

### 컨테이너 상태 확인 (배포 서버에서)

```bash
# 실행 중인 컨테이너 확인
docker ps

# 로그 확인
docker logs frontend-app
docker logs backend-app
docker logs mongodb

# 네트워크 확인
docker network inspect devops-network
```

## 트러블슈팅

### 1. Jenkins에서 Docker 명령어 실패

**증상**: `docker: command not found`

**해결**:

```bash
# Jenkins 서버에서
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### 2. SSH 접속 실패

**증상**: `Permission denied (publickey)`

**해결**:

- Jenkins Credentials에서 SSH 키 확인
- EC2 보안 그룹에서 22번 포트 열기
- 배포 서버에서 SSH 서비스 확인: `sudo systemctl status ssh`

### 3. DockerHub Push 실패

**증상**: `unauthorized: authentication required`

**해결**:

- Jenkins Credentials에서 DockerHub 계정 정보 확인
- DockerHub 로그인 확인: `docker login`
- Jenkinsfile의 `IMAGE_NAME`이 `username/image-name` 형식인지 확인

### 4. Backend가 MongoDB에 연결 실패

**증상**: `MongoTimeoutException` 또는 `Connection refused`

**해결**:

```bash
# 1. MongoDB 컨테이너 실행 확인
docker ps | grep mongodb

# 2. 네트워크 확인
docker network inspect devops-network

# 3. Backend 컨테이너가 같은 네트워크에 있는지 확인
docker inspect backend-app | grep NetworkMode

# 4. MongoDB 재시작
docker restart mongodb
```

### 5. Frontend에서 Backend API 호출 실패

**증상**: `ERR_CONNECTION_REFUSED` 또는 CORS 에러

**해결 방법 1**: 같은 네트워크 사용 (권장)

```bash
# Backend와 Frontend를 같은 네트워크에 연결
docker network connect devops-network frontend-app
docker network connect devops-network backend-app
```

**해결 방법 2**: Frontend의 `.env` 설정 확인

```bash
VITE_API_BASE_URL=http://your-ec2-ip:8080/api
```

### 6. 빌드 시간이 너무 오래 걸림

**해결**:

- Docker 빌드 캐시 활용
- `.dockerignore` 파일 추가로 불필요한 파일 제외
- Jenkins 서버의 리소스(CPU/메모리) 증설

### 7. 디스크 공간 부족

**증상**: `no space left on device`

**해결** (배포 서버에서):

```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a -f

# 디스크 사용량 확인
df -h
docker system df
```

## 모니터링

### Jenkins 빌드 알림 설정

Jenkinsfile의 `post` 섹션에 이메일 알림 추가:

```groovy
post {
    success {
        mail to: 'team@example.com',
             subject: "✅ ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} Success",
             body: "Deployment successful!\nURL: http://${REMOTE_HOST}:${PORT}"
    }
    failure {
        mail to: 'team@example.com',
             subject: "❌ ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} Failed",
             body: "Build failed. Check console output at ${env.BUILD_URL}"
    }
}
```

### 배포 서버 모니터링

```bash
# 실시간 로그 확인
docker logs -f backend-app
docker logs -f frontend-app

# 리소스 사용량 확인
docker stats
```

## 롤백 방법

### 특정 버전으로 롤백

```bash
# 1. 이전 이미지 태그 확인
docker images | grep frontend-app

# 2. 이전 버전으로 재배포
docker stop frontend-app
docker rm frontend-app
docker run -d --name frontend-app -p 8282:80 hgray1591/frontend-app:previous-tag
```

### Jenkins에서 이전 빌드 재실행

1. Jenkins > Pipeline > Build History
2. 이전 성공한 빌드 선택
3. **Rebuild** 클릭

## 참고 문서

- [Frontend Jenkinsfile](Frontend/devops3/Jenkinsfile)
- [Backend Jenkinsfile](Backend/Jenkinsfile)
- [Docker 배포 가이드](DOCKER_DEPLOYMENT.md)
- [Jenkins 공식 문서](https://www.jenkins.io/doc/)
- [Docker Pipeline Plugin](https://plugins.jenkins.io/docker-workflow/)

## 문의

문제가 발생하면 팀원에게 문의하거나 이슈를 등록해주세요.
