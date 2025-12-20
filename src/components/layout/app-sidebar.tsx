"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CheckSquare,
  UserCog,
  LogOut,
  User,
  Sun,
  Moon,
  Laptop,
  ChevronUp,
  Bell,
  Shield,
  Loader2,
  Briefcase,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

function AppSidebarContent(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const { state } = useSidebar();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    toast.loading("Logging out...", { id: "logout-toast" });
    
    try {
      // Simulate a small delay for UX
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 800));
      
      logout();
      toast.success("Successfully logged out!", { id: "logout-toast" });
      router.push("/");
    } catch (error) {
      toast.error("Failed to logout. Please try again.", { id: "logout-toast" });
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const navItems = React.useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/directory", label: "Directory", icon: Users },
      { href: "/jobs", label: "Jobs", icon: Briefcase },
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ];

    if (user?.role === "admin") {
      items.push({
        href: "/admin/approvals",
        label: "Approvals",
        icon: CheckSquare,
      });
      items.push({
        href: "/admin/account-approvals",
        label: "Accounts",
        icon: Shield,
      });
    }

    if (user?.role === "admin") {
      items.push({ href: "/admin/users", label: "Users", icon: UserCog });
    }

    return items;
  }, [user?.role]);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return <></>;

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        {/* Header with Logo */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <span className="text-lg font-bold">UD</span>
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">UD Professionals</span>
                    <span className="text-xs text-muted-foreground">
                      Directory
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Separator between header and navigation */}
        <SidebarSeparator />

        {/* Main Navigation */}
        <SidebarContent>
          <SidebarMenu className="gap-2">
            {navItems.map((item: NavItem) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <Icon className={isActive ? "text-primary" : ""} />
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer - Empty for now */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* User menu moved to header */}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AppSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    toast.loading("Logging out...", { id: "logout-toast" });
    
    try {
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 800));
      logout();
      toast.success("Successfully logged out!", { id: "logout-toast" });
      router.push("/");
    } catch (error) {
      toast.error("Failed to logout. Please try again.", { id: "logout-toast" });
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/directory", label: "Directory", icon: Users },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/admin/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/admin/account-approvals", label: "Accounts", icon: Shield },
    { href: "/admin/users", label: "Users", icon: UserCog },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarContent />
      {/* Main Content Area */}
      <SidebarInset>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <SidebarSeparator orientation="vertical" className="mr-2 h-4" />

          {/* Page Title/Breadcrumb */}
          <div className="flex flex-1 items-center gap-2">
            <span className="font-semibold text-lg">
              {navItems.find((item: NavItem) => item.href === pathname)?.label ||
                "UD Professionals Directory"}
            </span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* User Profile Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={undefined} alt={user.name} />
                      <AvatarFallback className="rounded-full text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 rounded-lg"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-2 py-2 text-left">
                      <Avatar className="h-10 w-10 rounded-full">
                        <AvatarImage src={undefined} alt={user.name} />
                        <AvatarFallback className="rounded-full">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left leading-tight">
                        <span className="truncate font-semibold text-sm">{user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Badge variant="outline" className="w-fit">
                      {user.role}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <NotificationPopover />
          </div>
        </header>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col overflow-auto"
        >
          {children}
        </motion.div>
      </SidebarInset>





      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

export { AppSidebarContent };
