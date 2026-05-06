import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refreshAuth() {
    setLoading(true);
    try {
      const status = await api.authStatus();
      setUser(status.user || null);
      setRequiresSetup(Boolean(status.requires_setup));
    } catch {
      setUser(null);
      setRequiresSetup(false);
    } finally {
      setLoading(false);
    }
  }

  async function login(payload) {
    const response = await api.login(payload);
    setUser(response.user || null);
    setRequiresSetup(false);
    return response;
  }

  async function setupOwner(payload) {
    const response = await api.setupOwner(payload);
    setUser(response.user || null);
    setRequiresSetup(false);
    return response;
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  useEffect(() => {
    refreshAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      requiresSetup,
      login,
      setupOwner,
      logout,
      refreshAuth,
    }),
    [user, loading, requiresSetup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
