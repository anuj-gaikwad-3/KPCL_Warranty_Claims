import React, { createContext, useState, useCallback, useContext } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "kpcl_auth";

const DEMO_CREDENTIALS = [
  { username: "admin@c4i4.org",   password: "admin123",   name: "Admin User",   role: "admin"  },
  { username: "viewer@kpcl.com",  password: "viewer123",  name: "Viewer User",  role: "viewer" },
];

function readAuth() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readAuth());

  const login = useCallback((username, password) => {
    const match = DEMO_CREDENTIALS.find(
      (c) => c.username === username.trim() && c.password === password
    );
    if (match) {
      const userData = { name: match.name, role: match.role, username: match.username };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      return { ok: true };
    }
    return { ok: false, error: "Invalid username or password." };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
