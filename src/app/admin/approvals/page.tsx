"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, BarChart3, Download, Shield } from "lucide-react";
import { VerificationManager } from "@/components/admin/verification-manager";
import { VerificationBadges } from "@/components/profile/verification-badges";
import { VerificationAnalytics } from "@/components/analytics/verification-analytics";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ProfileAnalytics } from "@/components/analytics/profile-analytics";
import { exportTableData } from "@/lib/export-utils";

const MotionCard = motion(Card);
const MotionDiv = motion.div;

export default function ApprovalsPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedProfiles, setSelectedProfiles] = React.useState<Set<Id<"profiles">>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const pendingProfiles = useQuery(
    api.profiles.getPendingProfiles,
    user ? { requesterId: user._id } : "skip"
  );

  const approveProfile = useMutation(api.profiles.approveProfile);
  const rejectProfile = useMutation(api.profiles.rejectProfile);
  const bulkApprove = useMutation(api.profiles.bulkApproveProfiles);
  const bulkReject = useMutation(api.profiles.bulkRejectProfiles);

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

  const handleToggleProfile = (profileId: Id<"profiles">): void => {
    const newSelection = new Set(selectedProfiles);
    if (newSelection.has(profileId)) {
      newSelection.delete(profileId);
    } else {
      newSelection.add(profileId);
    }
    setSelectedProfiles(newSelection);
  };

  const handleSelectAll = (): void => {
    if (!pendingProfiles) return;
    if (selectedProfiles.size === pendingProfiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(pendingProfiles.map((p) => p._id)));
    }
  };

  const handleApprove = async (profileId: Id<"profiles">): Promise<void> => {
    setActionLoading(true);
    try {
      await approveProfile({ requesterId: user._id, profileId });
      toast.success("Profile approved successfully");
    } catch (error) {
      toast.error("Failed to approve profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (profileId: Id<"profiles">, reason?: string): Promise<void> => {
    setActionLoading(true);
    try {
      await rejectProfile({ requesterId: user._id, profileId, reason });
      toast.success("Profile rejected");
    } catch (error) {
      toast.error("Failed to reject profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApprove = async (): Promise<void> => {
    if (selectedProfiles.size === 0) return;
    setActionLoading(true);
    try {
      const results = await bulkApprove({
        requesterId: user._id,
        profileIds: Array.from(selectedProfiles),
      });
      const successCount = results.filter((r) => r.success).length;
      toast.success(`Approved ${successCount} profile(s)`);
      setSelectedProfiles(new Set());
    } catch (error) {
      toast.error("Failed to approve profiles");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkReject = async (): Promise<void> => {
    if (selectedProfiles.size === 0) return;
    setActionLoading(true);
    try {
      const results = await bulkReject({
        requesterId: user._id,
        profileIds: Array.from(selectedProfiles),
        reason: rejectReason || undefined,
      });
      const successCount = results.filter((r) => r.success).length;
      toast.success(`Rejected ${successCount} profile(s)`);
      setSelectedProfiles(new Set());
      setRejectDialogOpen(false);
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to reject profiles");
    } finally {
      setActionLoading(false);
    }
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
      <><MotionDiv
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-4 md:p-8 space-y-6"
    >
      <MotionDiv variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Pending Approvals
          </h1>
          <p className="text-muted-foreground">
            Review and approve professional profiles
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2"
        >
          {pendingProfiles && pendingProfiles.length > 0 && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportTableData("csv", {
                      filename: `pending-approvals-${new Date().toISOString().split("T")[0]}`,
                      title: "Pending Approvals Report",
                      columns: [
                        { header: "Name", key: "name" },
                        { header: "Profession", key: "profession" },
                        { header: "Category", key: "category" },
                        { header: "Location", key: "location" },
                        { header: "Country", key: "country" },
                        { header: "Email", key: "userEmail" },
                      ],
                      data: pendingProfiles,
                    });
                    toast.success(`Exported ${pendingProfiles.length} profiles to CSV`);
                  } }
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportTableData("pdf", {
                      filename: `pending-approvals-${new Date().toISOString().split("T")[0]}`,
                      title: "Pending Approvals Report",
                      columns: [
                        { header: "Name", key: "name" },
                        { header: "Profession", key: "profession" },
                        { header: "Category", key: "category" },
                        { header: "Location", key: "location" },
                        { header: "Country", key: "country" },
                        { header: "Email", key: "userEmail" },
                      ],
                      data: pendingProfiles,
                    });
                    toast.success(`Exported ${pendingProfiles.length} profiles to PDF`);
                  } }
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </motion.div>
            </>
          )}
          <AnimatePresence>
            {selectedProfiles.size > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="default"
                    onClick={handleBulkApprove}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Selected ({selectedProfiles.size})
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Selected ({selectedProfiles.size})
                  </Button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </MotionDiv>

      {/* Analytics Section */}
      <MotionDiv variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Analytics</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ProfileAnalytics userId={user._id} />
          <VerificationAnalytics userId={user._id} />
        </div>
      </MotionDiv>

      {!pendingProfiles && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {pendingProfiles && pendingProfiles.length === 0 && (
        <MotionCard
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No pending profiles to review
            </p>
          </CardContent>
        </MotionCard>
      )}

      {pendingProfiles && pendingProfiles.length > 0 && (
        <MotionDiv
          variants={itemVariants}
          className="flex items-center gap-2 p-4 border rounded-md bg-muted/50"
        >
          <Checkbox
            checked={selectedProfiles.size === pendingProfiles.length}
            onCheckedChange={handleSelectAll} />
          <span className="text-sm font-medium">Select All</span>
        </MotionDiv>
      )}

      <AnimatePresence>
        <MotionDiv variants={containerVariants} className="space-y-4">
          {pendingProfiles?.map((profile, index) => (
            <MotionCard
              key={profile._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedProfiles.has(profile._id)}
                    onCheckedChange={() => handleToggleProfile(profile._id)} />
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.profilePicture} alt={profile.name} />
                    <AvatarFallback>
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{profile.name}</CardTitle>
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                    <CardDescription>
                      {profile.profession} • {profile.userEmail}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{profile.category}</Badge>
                      <VerificationBadges
                        emailVerified={profile.emailVerified}
                        phoneVerified={profile.phoneVerified}
                        pastorEndorsed={profile.pastorEndorsed}
                        backgroundCheck={profile.backgroundCheck}
                        size="sm" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pl-20">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm font-medium">Skills:</span>
                    <p className="text-sm text-muted-foreground">{profile.skills}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Location:</span>
                    <p className="text-sm text-muted-foreground">
                      {profile.location}, {profile.country}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Experience:</span>
                    <p className="text-sm text-muted-foreground">{profile.experience}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Services:</span>
                    <p className="text-sm text-muted-foreground">{profile.servicesOffered}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="default"
                      onClick={() => handleApprove(profile._id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(profile._id)}
                      disabled={actionLoading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </motion.div>
                  <VerificationManager
                    profile={profile}
                    requesterId={user._id}
                    trigger={<Button variant="outline" size="sm">
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Badges
                    </Button>} />
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </MotionDiv>
      </AnimatePresence>
    </MotionDiv><Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Selected Profiles</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejection. This will be sent to the users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Selected"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog></>
  );
}
