// 사용자 역할
export type UserRole = 'USER' | 'ADMIN';

// 사용자 데이터 구조
export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Mock 사용자 데이터 (실제로는 백엔드에서 관리)
export const usersData: User[] = [
  {
    _id: "507f191e810c19729de860e1",
    email: "user1@sogang.ac.kr",
    passwordHash: "hashed_password_1", // 실제로는 bcrypt 등으로 해시된 값
    nickname: "김철수",
    role: "USER",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    _id: "507f191e810c19729de860e2",
    email: "user2@sogang.ac.kr",
    passwordHash: "hashed_password_2",
    nickname: "이영희",
    role: "USER",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    _id: "507f191e810c19729de860e3",
    email: "admin@sogang.ac.kr",
    passwordHash: "hashed_password_admin",
    nickname: "관리자",
    role: "ADMIN",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

// 로그인 함수 (Mock)
export function loginUser(email: string, password: string): User | null {
  // 실제로는 백엔드 API를 호출하여 인증
  // 여기서는 간단히 이메일로만 확인
  const user = usersData.find(u => u.email === email);
  if (!user) return null;

  // 실제로는 password를 해시화하여 비교해야 함
  // 여기서는 간단히 모든 비밀번호를 "password"로 통일
  if (password !== "password") return null;

  return user;
}

// 사용자 닉네임 변경
export function updateUserNickname(userId: string, newNickname: string): boolean {
  const user = usersData.find(u => u._id === userId);
  if (!user) return false;

  user.nickname = newNickname;
  user.updatedAt = new Date().toISOString();
  return true;
}

// 사용자 비밀번호 변경
export function updateUserPassword(userId: string, currentPassword: string, newPassword: string): boolean {
  const user = usersData.find(u => u._id === userId);
  if (!user) return false;

  // 실제로는 현재 비밀번호를 확인해야 함
  if (currentPassword !== "password") return false;

  // 실제로는 새 비밀번호를 해시화하여 저장
  user.passwordHash = `hashed_${newPassword}`;
  user.updatedAt = new Date().toISOString();
  return true;
}
