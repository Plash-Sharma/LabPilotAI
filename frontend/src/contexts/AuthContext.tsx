import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clearCache, getApiToken, setApiToken } from '../api/client';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => getApiToken());

  const setToken = (newToken: string | null) => {
    setApiToken(newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    clearCache();
    setToken(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setTokenState(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
