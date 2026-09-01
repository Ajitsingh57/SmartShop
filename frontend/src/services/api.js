import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach authorization bearer token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("customerAuthToken") ||
      localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format and extract response errors with auto-session cleanup on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong. Please try again.";

    // If server rejects token as expired or unauthorized, automatically clear session
    if (status === 401) {
      authStorage.clear();
    }

    return Promise.reject(new Error(message));
  }
);

// User authentication endpoints
export const authApi = {
  register: async (userData) => {
    const response = await api.post("/users/register", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/users/login", credentials);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get("/users/my-profile");
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post("/users/change-password", passwordData);
    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await api.post("/users/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post("/users/reset-password", data);
    return response.data;
  },

  updateMyProfile: async (data) => {
    const response = await api.put("/users/my-profile", data);
    return response.data;
  },
};

// Customer sales history endpoints
export const salesApi = {
  getMySales: async () => {
    const response = await api.get("/sales/my");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },
};

// Product catalog endpoints
export const productsApi = {
  list: async () => {
    const response = await api.get("/products");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};

// Customer credit ledger endpoints
export const creditsApi = {
  getMyCredits: async () => {
    const response = await api.get("/credits/my");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/credits/${id}`);
    return response.data;
  },
};

// Customer payments and online checkout endpoints
export const paymentsApi = {
  getMyPayments: async () => {
    const response = await api.get("/payments/my");
    return response.data;
  },

  createClaim: async (paymentData) => {
    const response = await api.post("/payments/claim", paymentData);
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get("/payments/settings");
    return response.data;
  },

  createRazorpayOrder: async (data) => {
    const response = await api.post("/payments/razorpay/create-order", data);
    return response.data;
  },

  verifyRazorpayPayment: async (data) => {
    const response = await api.post("/payments/razorpay/verify", data);
    return response.data;
  },
};

// Customer returns history
export const returnsApi = {
  getMyReturns: async () => {
    const response = await api.get("/returns/my");
    return response.data;
  },
};

// Helper to parse JWT payload safely
export const parseJwt = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Validates whether a token exists, is well-formed, and is not expired
export const isTokenValid = (token) => {
  if (!token || typeof token !== "string") return false;
  const payload = parseJwt(token);
  if (!payload) return false;
  if (payload.exp && typeof payload.exp === "number") {
    // payload.exp is timestamp in seconds
    const isExpired = Date.now() >= payload.exp * 1000;
    if (isExpired) return false;
  }
  return true;
};

// Local storage session management
export const authStorage = {
  setToken: (token) => {
    localStorage.setItem("customerAuthToken", token);
    localStorage.setItem("authToken", token);
    window.dispatchEvent(new Event("auth-changed"));
  },

  getToken: () => {
    const token =
      localStorage.getItem("customerAuthToken") ||
      localStorage.getItem("authToken");

    if (!token) return null;

    // If token is expired or invalid, clear session immediately
    if (!isTokenValid(token)) {
      authStorage.clear();
      return null;
    }

    return token;
  },

  removeToken: () => {
    localStorage.removeItem("customerAuthToken");
    localStorage.removeItem("authToken");
    window.dispatchEvent(new Event("auth-changed"));
  },

  setUser: (user) => {
    localStorage.setItem("customerAuthUser", JSON.stringify(user));
    localStorage.setItem("authUser", JSON.stringify(user));
    window.dispatchEvent(new Event("auth-changed"));
  },

  getUser: () => {
    // Only return user if valid unexpired token exists
    const token = authStorage.getToken();
    if (!token) {
      return null;
    }

    const user =
      localStorage.getItem("customerAuthUser") ||
      localStorage.getItem("authUser");
    let parsedUser = null;
    if (user) {
      try {
        parsedUser = JSON.parse(user);
      } catch {
        parsedUser = null;
      }
    }

    // Fallback: If role or id is missing, recover from valid JWT
    const jwtPayload = parseJwt(token);
    if (jwtPayload) {
      if (!parsedUser) {
        parsedUser = {
          id: jwtPayload.id,
          role: jwtPayload.role,
        };
      } else {
        if (!parsedUser.role && jwtPayload.role) {
          parsedUser.role = jwtPayload.role;
        }
        if (!parsedUser.id && jwtPayload.id) {
          parsedUser.id = jwtPayload.id;
        }
      }
    }

    return parsedUser;
  },

  removeUser: () => {
    localStorage.removeItem("customerAuthUser");
    localStorage.removeItem("authUser");
    window.dispatchEvent(new Event("auth-changed"));
  },

  clear: () => {
    localStorage.removeItem("customerAuthToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("customerAuthUser");
    localStorage.removeItem("authUser");
    window.dispatchEvent(new Event("auth-changed"));
  },

  isAuthenticated: () => {
    const token = authStorage.getToken();
    return Boolean(token && isTokenValid(token));
  },
};

// Generic authenticated API caller
export const authRequest = async (endpoint, options = {}) => {
  const response = await api({
    url: endpoint,
    ...options,
  });
  return response.data;
};

// Shop information endpoint
export const aboutApi = {
  get: async () => {
    const response = await api.get("/about");
    return response.data;
  },
};

// Customer product request endpoints
export const productRequestsApi = {
  create: async (formData) => {
    const response = await api.post("/product-requests", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get("/product-requests/my");
    return response.data;
  },
};

export default api;