import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      console.log("Verifying token...");
      const response = await axios.get("http://localhost:5000/api/auth/me");
      console.log("User data from /api/auth/me:", response.data);

      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Token verification failed:", error);
      console.log("Error response:", error.response?.data);
      setLoading(false);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );
      const { token: receivedToken, user } = response.data;

      if (receivedToken && user) {
        localStorage.setItem("token", receivedToken);
        setToken(receivedToken);
        setUser(user);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${receivedToken}`;
      } else {
        throw new Error("Login response missing token or user data.");
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed. Please try again.",
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        userData
      );
      const { token: receivedToken, user } = response.data;

      if (receivedToken && user) {
        localStorage.setItem("token", receivedToken);
        setToken(receivedToken);
        setUser(user);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${receivedToken}`;
      } else {
        throw new Error("Signup response missing token or user data.");
      }

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Signup failed. Please try again.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
