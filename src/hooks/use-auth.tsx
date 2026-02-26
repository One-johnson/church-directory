"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getSessionCookie, setSessionCookie, clearSessionCookie } from "@/lib/session-cookie";

interface User {
  userId: Id<"users">;
  _id: Id<"users">;
  email: string;
  phone?: string;
  name: string;
  role: "admin" | "member";
  emailVerified: boolean;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sessionId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loginAction = useAction(api.authActions.loginAction);
  const logoutMutation = useMutation(api.auth.logout);

  const user = useQuery(
    api.auth.getCurrentUser,
    sessionId ? { sessionId } : "skip"
  ) as User | null | undefined;

  // Load session from cookie on mount (no localStorage)
  React.useEffect(() => {
    const sid = getSessionCookie();
    setSessionId(sid);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const result = await loginAction({ email, password });
    setSessionCookie(result.sessionId);
    setSessionId(result.sessionId);
    router.push("/dashboard");
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<void> => {
    // Registration with denomination is handled by EnhancedRegisterForm and authActions.registerWithDenomination
    throw new Error(
      "Use the enhanced registration form with denomination and branch selection"
    );
  };

  const logout = (): void => {
    if (sessionId) {
      logoutMutation({ sessionId }).catch(() => {});
    }
    clearSessionCookie();
    setSessionId(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading || (sessionId !== null && user === undefined),
        sessionId,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
