// utils/api.js
import axios from "axios";

// ✅ Load API base URL from environment variable
// Example .env: VITE_API_URL=https://facult-proj-f.vercel.app/api/v1
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Generic API request function using axios
export const apiRequest = async ({
  endpoint,
  method = "GET",
  headers = {},
  body = null,
  withCredentials = false
}) => {
  try {
    const config = {
      url: `${BASE_URL}${endpoint}`,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      withCredentials,
    };

    if (body) {
      config.data = body;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "An error occurred");
  }
};

// ✅ Login user
export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // important for cookies
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Invalid credentials");
  }

  const data = await response.json();
  localStorage.setItem("authToken", data.token);
  return data.user;
};

// ✅ Check session
export async function checkSession() {
  try {
    const response = await axios.get(`${BASE_URL}/user/check-session`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Session validation failed");
  }
}

// ✅ Signup user
export async function signupUser({ name, email, password }) {
  try {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error("Signup failed");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ✅ Send forgot password request
export async function sendPasswordReset(email) {
  const response = await fetch(`${BASE_URL}/user/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to send reset email");
  }

  return await response.json();
}

// ✅ Reset password
export async function resetPassword(token, newPassword) {
  const response = await fetch(`${BASE_URL}/user/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    throw new Error("Failed to reset password");
  }

  return await response.json();
}
