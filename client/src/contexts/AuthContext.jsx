import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    try {
      return localStorage.getItem("token") || null;
    } catch (error) {
      console.error("Error reading token from localStorage:", error);
      return null;
    }
  });

  // Use ref to track if we're in the middle of login/register
  const isAuthenticating = useRef(false);

  // Base URL for API calls
  const API_BASE_URL = "http://localhost:5000/api";

  // Configure axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.defaults.baseURL = "http://localhost:5000";
      axios.defaults.timeout = 10000;
      console.log("Token set in axios headers");

      // Only verify token if we're not in the middle of authenticating
      if (!isAuthenticating.current) {
        verifyToken();
      }
    } else {
      console.log("No token found, removing authorization header");
      delete axios.defaults.headers.common["Authorization"];
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log("Verifying token...");
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      console.log("User data from /api/auth/me:", response.data);

      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Token verification failed:", error);
      console.log("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Clear invalid token
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Token is invalid, logging out...");
        logout();
      }
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("Attempting login for:", email);
      isAuthenticating.current = true;

      // Clear any existing token first
      delete axios.defaults.headers.common["Authorization"];

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      console.log("Login response received:", response.data);

      const { token: receivedToken, user: receivedUser } = response.data;

      if (!receivedToken || !receivedUser) {
        throw new Error("Login response missing token or user data.");
      }

      // Store token in localStorage
      try {
        localStorage.setItem("token", receivedToken);
      } catch (error) {
        console.error("Error saving token to localStorage:", error);
      }

      // Set axios header immediately
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${receivedToken}`;

      // Update state
      setUser(receivedUser);
      setToken(receivedToken);

      console.log("Login successful, user set:", receivedUser.email);

      isAuthenticating.current = false;
      return { success: true, user: receivedUser };
    } catch (error) {
      isAuthenticating.current = false;

      console.error("Login error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
      });

      let errorMessage = "Login failed. Please try again.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message || "Invalid email or password.";
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || "Account is inactive.";
      } else if (
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED"
      ) {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log("Attempting registration:", userData);
      isAuthenticating.current = true;

      // Clear any existing token first
      delete axios.defaults.headers.common["Authorization"];

      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        userData
      );

      console.log("Registration response:", response.data);

      const { token: receivedToken, user: receivedUser } = response.data;

      if (!receivedToken || !receivedUser) {
        throw new Error("Registration response missing token or user data.");
      }

      // Store token in localStorage
      try {
        localStorage.setItem("token", receivedToken);
      } catch (error) {
        console.error("Error saving token to localStorage:", error);
      }

      // Set axios header immediately
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${receivedToken}`;

      // Update state
      setUser(receivedUser);
      setToken(receivedToken);

      isAuthenticating.current = false;
      return { success: true, user: receivedUser };
    } catch (error) {
      isAuthenticating.current = false;

      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED"
      ) {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running.";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    console.log("Logging out...");
    try {
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Error removing token from localStorage:", error);
    }
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
