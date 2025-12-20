"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Loader2, AlertCircle, Shield, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
import { UsersTable } from "@/components/tables/users-table";
import { AdminAnalytics } from "@/components/analytics/admin-analytics";
import { exportTableData } from "@/lib/export-utils";

interface UserWithProfile {
  _id: Id<"users">;
  email: string;
  phone?: string;
  name: string;
  role: "admin" | "member";
  emailVerified: boolean;
  createdAt: number;
  hasProfile: boolean;
  profileStatus?: "pending" | "approved" | "rejected";
}

export default function UsersPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedUsers, setSelectedUsers] = React.useState<Id<"users">[]>([]);
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<"admin" | "member">("member");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<Id<"users"> | null>(null);

  const users = useQuery(
    api.users.getAllUsers,
    user ? { requesterId: user._id } : "skip"
  ) as UserWithProfile[] | undefined;

  const updateUserRole = useMutation(api.users.updateUserRole);
  const bulkUpdateRoles = useMutation(api.users.bulkUpdateUserRoles);
  const deleteUser = useMutation(api.users.deleteUser);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
        <main className="container mx-auto p-4 md:p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to access this page.
            </AlertDescription>
          </Alert>
        </main>
    );
  }

  const handleUpdateRole = async (userId: Id<"users">, newRole: "admin" | "member"): Promise<void> => {
    setActionLoading(true);
    try {
      await updateUserRole({ requesterId: user._id, targetUserId: userId, newRole });
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUpdateRoles = async (): Promise<void> => {
    if (selectedUsers.length === 0) return;
    setActionLoading(true);
    try {
      const updates = selectedUsers.map((userId) => ({
        userId,
        newRole: selectedRole,
      }));
      const results = await bulkUpdateRoles({ requesterId: user._id, updates });
      const successCount = results.filter((r) => r.success).length;
      toast.success(`Updated ${successCount} user role(s)`);
      setSelectedUsers([]);
      setBulkRoleDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update user roles");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserClick = (userId: Id<"users">): void => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!userToDelete) return;
    
    setActionLoading(true);
    try {
      await deleteUser({ requesterId: user._id, targetUserId: userToDelete });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
      <><><div className="container mx-auto p-4 md:p-8 pt-6 md:pt-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {users && users.length > 0 && (
            <>
              <div className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto transition-all hover:scale-105 active:scale-95"
                  onClick={() => {
                    exportTableData("csv", {
                      filename: `users-${new Date().toISOString().split("T")[0]}`,
                      title: "User Management Report",
                      columns: [
                        { header: "Name", key: "name" },
                        { header: "Email", key: "email" },
                        { header: "Role", key: "role" },
                        { header: "Profile Status", key: "profileStatus" },
                        { header: "Verified", key: "emailVerified" },
                      ],
                      data: users,
                    });
                    toast.success(`Exported ${users.length} users to CSV`);
                  } }
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
              <div className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto transition-all hover:scale-105 active:scale-95"
                  onClick={() => {
                    exportTableData("pdf", {
                      filename: `users-${new Date().toISOString().split("T")[0]}`,
                      title: "User Management Report",
                      columns: [
                        { header: "Name", key: "name" },
                        { header: "Email", key: "email" },
                        { header: "Role", key: "role" },
                        { header: "Profile Status", key: "profileStatus" },
                        { header: "Verified", key: "emailVerified" },
                      ],
                      data: users,
                    });
                    toast.success(`Exported ${users.length} users to PDF`);
                  } }
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </>
          )}
          {selectedUsers.length > 0 && (
            <div className="w-full sm:w-auto animate-in zoom-in-95 duration-300">
              <Button onClick={() => setBulkRoleDialogOpen(true)} disabled={actionLoading} className="w-full sm:w-auto transition-all hover:scale-105 active:scale-95">
                <Shield className="mr-2 h-4 w-4" />
                Update Roles ({selectedUsers.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-700 delay-150">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
        </div>
        <AdminAnalytics userId={user._id} />
      </div>

      {/* Users Table */}
      {!users && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {users && (
        <Card className="p-6 animate-in slide-in-from-bottom-8 duration-700 delay-300 transition-all hover:shadow-lg">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">All Users</h3>
            <UsersTable
              users={users}
              currentUserId={user._id}
              onUpdateRole={handleUpdateRole}
              onDeleteUser={handleDeleteUserClick}
              onSelectionChange={setSelectedUsers}
              loading={actionLoading} />
          </div>
        </Card>
      )}
    </div><Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Selected User Roles</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUsers.length} selected user(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "admin" | "member")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>

                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateRoles} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Roles"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog></><AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog></>
  );
}
