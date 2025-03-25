import { createContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  uuid: string;
  username: string;
  exp: number;
  iat: number;
}

const AuthContext = createContext<{
  user: any;
  login: (token: string) => void;
  logout: () => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUser({ token, ...decoded });
      } catch (e) {
        console.error("Invalid token");
        localStorage.removeItem("authToken");
      }
    }
  }, []);

  const login = (token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      localStorage.setItem("authToken", token);
      setUser({ token, ...decoded });
    } catch (e) {
      console.error("Login failed — invalid token");
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
