import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface AppContextType {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  isAuthenticated: boolean;
  isXeroConnected: boolean;
  login: () => void;
  loginWithXero: () => void;
  logout: () => void;
  webhookResponse: any;
  setWebhookResponse: (response: any) => void;
  webhookError: boolean;
  setWebhookError: (error: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [webhookError, setWebhookError] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isXeroConnected, setIsXeroConnected] = useState<boolean>(() => {
    return localStorage.getItem('isXeroConnected') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('isXeroConnected', String(isXeroConnected));
  }, [isXeroConnected]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    setIsXeroConnected(false);
  }, []);

  const loginWithXero = useCallback(() => {
    setIsAuthenticated(true);
    setIsXeroConnected(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsXeroConnected(false);
    setUploadedFile(null);
  }, []);

  const value = useMemo(
    () => ({
      uploadedFile,
      setUploadedFile,
      isAuthenticated,
      isXeroConnected,
      login,
      loginWithXero,
      logout,
      webhookResponse,
      setWebhookResponse,
      webhookError,
      setWebhookError,
    }),
    [uploadedFile, isAuthenticated, isXeroConnected, login, loginWithXero, logout, webhookResponse, webhookError]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
