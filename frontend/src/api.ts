const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiSuccess = { success: true; message: string; token?: string };
type ApiFailure = { success: false; error: string };
type ApiResult = ApiSuccess | ApiFailure;

// ✅ Login Request
export const loginUser = async (username: string, password: string): Promise<ApiResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      // credentials: "include", // Uncomment if you switch to cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed.");
    }

    // ✅ Store JWT Token & User Info
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("uuid", data.user.uuid);

    return { success: true, message: "Login successful!", token: data.token };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
};

// ✅ Registration Request
export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<ApiResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed.");
    }

    return { success: true, message: "Verification email sent!" };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
};

// ✅ Logout Function (Clear JWT & Local Storage)
export const logoutUser = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  localStorage.removeItem("uuid");
};
