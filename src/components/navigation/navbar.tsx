"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isActive = (path: string): boolean => pathname === path;

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U";


  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Church Directory
            </Link>

            <div className="hidden md:flex space-x-4">
              <Link href="/dashboard">
                <Button
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              <Link href="/directory">
                <Button
                  variant={isActive("/directory") ? "default" : "ghost"}
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Directory
                </Button>
              </Link>

              <Link href="/messages">
                <Button
                  variant={isActive("/messages") ? "default" : "ghost"}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>

              {(user.role === "admin" || user.role === "pastor") && (
                <Link href="/admin/approvals">
                  <Button
                    variant={isActive("/admin/approvals") ? "default" : "ghost"}
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Approvals
                  </Button>
                </Link>
              )}

              {user.role === "admin" && (
                <Link href="/admin/users">
                  <Button
                    variant={isActive("/admin/users") ? "default" : "ghost"}
                    size="sm"
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Users
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
