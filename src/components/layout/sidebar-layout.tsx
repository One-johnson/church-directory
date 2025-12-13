"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AppSidebarLayout } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps): React.JSX.Element {
  const { user } = useAuth();
  const pathname = usePathname();

  // Pages that should not have the sidebar
  const noSidebarPages = ["/", "/login", "/register", "/offline"];
  const shouldShowSidebar =
    user && !noSidebarPages.includes(pathname) && !pathname.startsWith("/api");

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return <AppSidebarLayout>{children}</AppSidebarLayout>;
}
