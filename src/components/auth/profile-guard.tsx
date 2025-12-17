"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();

  // Query for user profile
  const profile = useQuery(
    api.profiles.getUserProfile,
    user ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Pages that don't require a profile
  const publicPages = ["/", "/login", "/register", "/offline"];
  const profileCreationPage = "/profile/create";
  const isPublicPage = publicPages.includes(pathname);
  const isProfileCreationPage = pathname === profileCreationPage;
  const isApiRoute = pathname.startsWith("/api");

  React.useEffect(() => {
    // Don't do anything while loading
    if (authLoading || profile === undefined) return;

    // Allow public pages and API routes
    if (isPublicPage || isApiRoute) return;

    // If user is logged in but has no profile
    if (user && !profile) {
      // If not already on profile creation page, redirect there
      if (!isProfileCreationPage) {
        router.push(profileCreationPage);
      }
    }

    // If user has a profile and is on profile creation page, redirect to dashboard
    if (user && profile && isProfileCreationPage) {
      router.push("/dashboard");
    }
  }, [user, profile, authLoading, pathname, isPublicPage, isProfileCreationPage, isApiRoute, router, profileCreationPage]);

  // Show loading state while checking profile
  if (!isPublicPage && !isApiRoute && user && profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Block access to protected pages if no profile exists
  if (!isPublicPage && !isApiRoute && !isProfileCreationPage && user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting to profile creation...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
