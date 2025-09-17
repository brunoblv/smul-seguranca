"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: number;
  username: string;
  nome: string;
  email?: string;
  admin: boolean;
  permissoes: string[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
  });

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.success && data.data?.user) {
        const user = data.data.user;
        setAuthState({
          user,
          loading: false,
          isAdmin: user.admin,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          isAdmin: false,
        });
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setAuthState({
        user: null,
        loading: false,
        isAdmin: false,
      });
    }
  };

  const refreshAuth = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    await checkAuth();
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      setAuthState({
        user: null,
        loading: false,
        isAdmin: false,
      });
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        refreshAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
