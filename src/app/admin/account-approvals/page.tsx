"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Church,
  MapPin,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppNavbar } from "@/components/layout/app-navbar";

const MotionCard = motion(Card);
const MotionDiv = motion.div;

export default function AccountApprovalsPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedUsers, setSelectedUsers] = React.useState<Set<Id<"users">>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectingUserId, setRejectingUserId] = React.useState<Id<"users"> | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const pendingApprovals = useQuery(api.userApprovals.getPendingApprovals);
  const approvalStats = useQuery(api.userApprovals.getApprovalStats);
  const approveUser = useMutation(api.userApprovals.approveUserAccount);
  const rejectUser = useMutation(api.userApprovals.rejectUserAccount);
  const bulkApprove = useMutation(api.userApprovals.bulkApproveUsers);
  const bulkReject = useMutation(api.userApprovals.bulkRejectUsers);

  React.useEffect(() => {
    if (!authLoading && (!user || (user.role !== "admin" && user.role !== "pastor"))) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSelectUser = (userId: Id<"users">): void => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (): void => {
    if (selectedUsers.size === pendingApprovals?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingApprovals?.map((u) => u._id) || []));
    }
  };

  const handleApproveUser = async (userId: Id<"users">): Promise<void> => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await approveUser({ userId, approverId: user._id });
      toast.success("User account approved successfully!");
      setSelectedUsers(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve user");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async (): Promise<void> => {
    if (!user || !rejectingUserId || !rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      await rejectUser({
        userId: rejectingUserId,
        approverId: user._id,
        reason: rejectReason,
      });
      toast.success("User account rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setRejectingUserId(null);
      setSelectedUsers(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject user");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async (): Promise<void> => {
    if (!user || selectedUsers.size === 0) return;
    setIsProcessing(true);
    try {
      const result = await bulkApprove({
        userIds: Array.from(selectedUsers),
        approverId: user._id,
      });
      toast.success(`Approved ${result.count} user accounts!`);
      setSelectedUsers(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve users");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async (): Promise<void> => {
    if (!user || selectedUsers.size === 0 || !rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      const result = await bulkReject({
        userIds: Array.from(selectedUsers),
        approverId: user._id,
        reason: rejectReason,
      });
      toast.success(`Rejected ${result.count} user accounts`);
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedUsers(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject users");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || !user || (user.role !== "admin" && user.role !== "pastor")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto py-8 px-4 space-y-6"
      >
        <MotionDiv variants={fadeInUp}>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold"
          >
            Account Approvals
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground"
          >
            Review and approve new user registrations
          </motion.p>
        </MotionDiv>

        {/* Statistics */}
        <MotionDiv
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <MotionCard variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              {approvalStats ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-3xl font-bold"
                >
                  {approvalStats.total}
                </motion.div>
              ) : (
                <Skeleton className="h-10 w-20" />
              )}
            </CardContent>
          </MotionCard>

          <MotionCard
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="border-amber-500/50 bg-amber-500/5"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalStats ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="text-3xl font-bold text-amber-500"
                >
                  {approvalStats.pending}
                </motion.div>
              ) : (
                <Skeleton className="h-10 w-20" />
              )}
            </CardContent>
          </MotionCard>

          <MotionCard
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="border-green-500/50 bg-green-500/5"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalStats ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="text-3xl font-bold text-green-500"
                >
                  {approvalStats.approved}
                </motion.div>
              ) : (
                <Skeleton className="h-10 w-20" />
              )}
            </CardContent>
          </MotionCard>

          <MotionCard
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="border-red-500/50 bg-red-500/5"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalStats ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="text-3xl font-bold text-red-500"
                >
                  {approvalStats.rejected}
                </motion.div>
              ) : (
                <Skeleton className="h-10 w-20" />
              )}
            </CardContent>
          </MotionCard>
        </MotionDiv>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{selectedUsers.size} user(s) selected</span>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleBulkApprove}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Selected
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectingUserId(null);
                          setRejectDialogOpen(true);
                        }}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Selected
                      </Button>
                    </motion.div>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending Approvals List */}
        <MotionCard variants={itemVariants} whileHover={{ scale: 1.002 }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  {pendingApprovals?.length || 0} user(s) waiting for approval
                </CardDescription>
              </div>
              {pendingApprovals && pendingApprovals.length > 0 && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedUsers.size === pendingApprovals.length ? "Deselect All" : "Select All"}
                  </Button>
                </motion.div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!pendingApprovals ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground">No pending account approvals</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pendingApprovals.map((userAccount, index) => (
                    <motion.div
                      key={userAccount._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 5 }}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedUsers.has(userAccount._id)}
                          onCheckedChange={() => handleSelectUser(userAccount._id)}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{userAccount.name}</h3>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="outline">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {userAccount.email}
                                </Badge>
                                {userAccount.phone && (
                                  <Badge variant="outline">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {userAccount.phone}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(userAccount.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Church className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{userAccount.denominationName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {userAccount.branchName} - {userAccount.branchLocation}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <UserIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{userAccount.pastor}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{userAccount.pastorEmail}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveUser(userAccount._id)}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setRejectingUserId(userAccount._id);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={isProcessing}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </MotionCard>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {rejectingUserId ? "Reject User Account" : "Reject Selected Accounts"}
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. The user(s) will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Reason for Rejection</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={rejectingUserId ? handleRejectUser : handleBulkReject}
                disabled={!rejectReason.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MotionDiv>
    </div>
  );
}
