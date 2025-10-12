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

      // 응답이 토큰 문자열만 있는 경우 처리
      let token: string;
      if (typeof response === 'string') {
        token = response;
      } else if (response.token) {
        token = response.token;
      } else {
        throw new Error("No token in response");
      }

      // JWT 토큰 저장
      authAPI.saveToken(token);

      // 토큰으로 사용자 정보 가져오기
      const userProfile = await authAPI.getMyProfile();
      console.log("User profile:", userProfile);

      const userToSave: User = {
        _id: userProfile.id,
        email: userProfile.email,
        nickname: userProfile.nickname,
        passwordHash: "", // 불필요하므로 빈 문자열
        role: "USER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
  };

  const updateNickname = async (newNickname: string) => {
    try {
      const updatedProfile = await authAPI.updateMyProfile({
        nickname: newNickname,
      });

      if (user) {
        const updatedUser = { ...user, nickname: updatedProfile.nickname };
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
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
