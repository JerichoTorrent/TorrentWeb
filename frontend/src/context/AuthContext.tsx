import { createContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  uuid: string;
  username: string;
  is_staff: boolean;
  exp: number;
  iat: number;
}

interface AuthUser extends DecodedToken {
  token: string;
  level?: number;
  total_xp?: number;
  badge?: string;
  xp_this_week?: number;
}

const AuthContext = createContext<{
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp > now) {
          fetch(`/api/users/${decoded.username}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then(res => res.json())
            .then(data => {
              setUser({
                token,
                ...decoded,
                level: data.level,
                total_xp: data.total_xp,
              });
            })
            .catch(() => {
              setUser({ token, ...decoded });
            })
            .finally(() => setLoading(false));
        } else {
          console.warn("Token expired");
          localStorage.removeItem("authToken");
          setLoading(false);
        }
      } catch (e) {
        console.error("Invalid token:", e);
        localStorage.removeItem("authToken");
        setLoading(false);
      }
    } else {
      setLoading(false); // If no token, then loading complete
    }
  }, []);

  const login = (token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp > now) {
        localStorage.setItem("authToken", token);

        fetch(`/api/users/${decoded.username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            setUser({
              token,
              ...decoded,
              level: data.level,
              total_xp: data.total_xp,
            });
          })
          .catch(() => {
            setUser({ token, ...decoded });
          });
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
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
