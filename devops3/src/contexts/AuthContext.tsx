import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginUser as mockLogin, type User } from '../data/users';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateNickname: (newNickname: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 초기화: localStorage에서 로그인 정보 복원
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock 로그인 (실제로는 API 호출)
    const loggedInUser = mockLogin(email, password);
    if (loggedInUser) {
      // passwordHash는 저장하지 않음
      const userToSave = { ...loggedInUser };
      delete (userToSave as any).passwordHash;

      setUser(userToSave);
      localStorage.setItem('currentUser', JSON.stringify(userToSave));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateNickname = (newNickname: string) => {
    if (user) {
      const updatedUser = { ...user, nickname: newNickname };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateNickname,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
