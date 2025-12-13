"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, User, LogOut, Settings, Sun, Moon, Laptop, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { toast } from "sonner";


export function AppNavbar(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

const confirmLogout = async (): Promise<void> => {
  try {
    setLoggingOut(true);
    await logout(); // ensure logout is async
    toast.success("Successfully logged out");

    // Wait a bit so the user sees the toast
    await new Promise((resolve) => setTimeout(resolve, 500));

    router.push("/");
  } catch (error) {
    toast.error("Failed to log out. Please try again.");
  } finally {
    setLoggingOut(false);
    setLogoutOpen(false);
  }
};




  const navItems = React.useMemo(() => {
    const items = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/directory", label: "Directory" },
      { href: "/messages", label: "Messages" },
    ];

    if (user?.role === "admin" || user?.role === "pastor") {
      items.push({ href: "/admin/approvals", label: "Approvals" });
    }

    if (user?.role === "admin") {
      items.push({ href: "/admin/users", label: "Users" });
    }

    return items;
  }, [user?.role]);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const ThemeSubmenu = (): React.JSX.Element => (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className="mr-2 h-4 w-4" />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  if (!user) return <></>;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">

      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-lg font-bold">UD</span>
          </div>
          <span className="hidden font-bold sm:inline-block">Professionals Directory</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationPopover />

          {/* User Menu - Desktop */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge variant="outline" className="w-fit text-xs mt-1">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <ThemeSubmenu />
                <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
  <LogOut className="mr-2 h-4 w-4" />
  Log out
</DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {/* User Info */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted">
                  <Avatar>
                    <AvatarImage src={undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <DropdownMenuSeparator />

                {/* Theme Selector */}
                <div className="space-y-2 px-4">
                  <p className="text-sm font-medium">Theme</p>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="flex-1"
                    >
                      <Laptop className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push("/profile/edit");
                      setMobileOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Button>
                  <Button
  variant="outline"
  className="w-full justify-start"
  onClick={() => setLogoutOpen(true)}
>
  <LogOut className="mr-2 h-4 w-4" />
  Log out
</Button>

                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
<Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Confirm logout</DialogTitle>
      <DialogDescription className="text-md font-semibold">
        Are you sure you want to log out of your account?
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="gap-2 sm:gap-2">
  <Button
    variant="outline"
    onClick={() => setLogoutOpen(false)}
    disabled={loggingOut}
  >
    Cancel
  </Button>

  <Button
    variant="destructive"
    onClick={confirmLogout}
    disabled={loggingOut}
  >
    {loggingOut && (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    )}
    Log out
  </Button>
</DialogFooter>

  </DialogContent>
</Dialog>





    </header>
  );
}
