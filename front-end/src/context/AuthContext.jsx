import { useEffect, useState } from "react";
import { AuthContext } from "./authContextValue";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  registerCustomer,
} from "../services/authApi";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================
  // CHECK AUTH
  // =========================================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // =========================================
  // LOGIN
  // =========================================

  const login = async (identifier, password) => {
    const data = await loginRequest(identifier, password);

    if (!data?.user) {
      throw new Error("پاسخ ورود نامعتبر است: اطلاعات کاربر دریافت نشد.");
    }

    setUser(data.user);

    return data.user;
  };

  // =========================================
  // REGISTER
  // =========================================

  const register = async (username, phone, password) => {
    const data = await registerCustomer(username, phone, password);

    if (!data?.user) {
      throw new Error("پاسخ ثبت‌نام نامعتبر است: اطلاعات کاربر دریافت نشد.");
    }

    setUser(data.user);

    return data.user;
  };

  // =========================================
  // LOGOUT
  // =========================================

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

