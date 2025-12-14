"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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
  const [userId, setUserId] = React.useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);

  const user = useQuery(
    api.auth.getCurrentUser,
    userId ? { userId } : "skip"
  ) as User | null | undefined;

  // Load user from localStorage on mount
  React.useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const result = await loginMutation({ email, password });
      localStorage.setItem("userId", result.userId as string);
      setUserId(result.userId);
      router.push("/dashboard");
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<void> => {
    try {
      const result = await registerMutation({ email, password, name, phone });
      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  };

  const logout = (): void => {
    localStorage.removeItem("userId");
    setUserId(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoading || (userId !== null && user === undefined),
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
