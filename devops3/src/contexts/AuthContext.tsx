import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "../data/users";
import * as authAPI from "../api/auth";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateNickname: (newNickname: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 초기화: localStorage에서 로그인 정보 복원
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const token = authAPI.getToken();

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      console.log("Login API response:", response);

      // JWT 토큰 저장
      authAPI.saveToken(response.accessToken);

      // refreshToken 저장
      localStorage.setItem("refreshToken", response.refreshToken);

      // 응답에 포함된 user 정보 사용
      const userProfile = response.user;
      console.log("User profile:", userProfile);

      const userToSave: User = {
        _id: userProfile._id,
        email: userProfile.email,
        nickname: userProfile.nickname,
        passwordHash: "", // 불필요하므로 빈 문자열
        role: userProfile.role as "USER" | "ADMIN",
        createdAt: "", // 백엔드 응답에 없으므로 빈 문자열
        updatedAt: "", // 백엔드 응답에 없으므로 빈 문자열
      };

      setUser(userToSave);
      localStorage.setItem("currentUser", JSON.stringify(userToSave));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    authAPI.removeToken();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("refreshToken");
  };

  const updateNickname = async (newNickname: string) => {
    try {
      console.log("Before update, user:", user);

      // 닉네임 업데이트 요청 (서버가 빈 응답을 보냄)
      await authAPI.updateMyProfile({
        nickname: newNickname,
      });

      // 서버가 빈 응답을 보내므로, 업데이트된 정보를 다시 조회
      const updatedProfile = await authAPI.getMyProfile();
      console.log("Fetched updated profile:", updatedProfile);

      if (user) {
        const updatedUser: User = {
          _id: updatedProfile._id,
          email: updatedProfile.email,
          nickname: updatedProfile.nickname,
          passwordHash: "",
          role: updatedProfile.role as "USER" | "ADMIN",
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        };
        console.log("Updated user object:", updatedUser);
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        console.log("After setUser");
      }
    } catch (error) {
      console.error("Failed to update nickname:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateNickname,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
