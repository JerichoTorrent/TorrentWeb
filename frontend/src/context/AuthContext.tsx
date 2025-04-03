import { createContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  uuid: string;
  username: string;
  is_staff: boolean;
  exp: number; // expiration (UNIX)
  iat: number;
}

interface AuthUser extends DecodedToken {
  token: string;
}

const AuthContext = createContext<{
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp > now) {
          setUser({ token, ...decoded });
        } else {
          console.warn("Token expired");
          localStorage.removeItem("authToken");
        }
      } catch (e) {
        console.error("Invalid token:", e);
        localStorage.removeItem("authToken");
      }
    }
  }, []);

  const login = (token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp > now) {
        localStorage.setItem("authToken", token);
        setUser({ token, ...decoded });
      } else {
        console.warn("Login failed — token expired");
      }
    } catch (e) {
      console.error("Login failed — invalid token:", e);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
