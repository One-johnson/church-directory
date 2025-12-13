"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { AppNavbar } from "@/components/layout/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  MessageSquare,
  Loader2,
  BarChart3,
} from "lucide-react";
import { DashboardAnalytics } from "@/components/analytics/dashboard-analytics";
import { AdminDashboard } from "./admin-dashboard";
import { AccountStatusCard } from "@/components/dashboard/account-status-card";

const MotionCard = motion(Card);
const MotionDiv = motion.div;

export default function DashboardPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const profile = useQuery(
    api.profiles.getUserProfile,
    user ? { userId: user._id } : "skip"
  );

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (): React.JSX.Element => {
    if (!profile) return <></>;

    switch (profile.status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        );
      default:
        return <></>;
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
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto p-4 md:p-8 space-y-8"
      >
        {/* Welcome Section */}
        <MotionDiv variants={itemVariants} className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight"
          >
            Welcome back, {user.name}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground"
          >
            Manage your professional profile and connect with the community
          </motion.p>
        </MotionDiv>

        {/* Account Status Card */}
        <MotionDiv variants={itemVariants}>
          <AccountStatusCard user={user as any} />
        </MotionDiv>

        {/* Admin Analytics Section (Only for Admins/Pastors) */}
        {(user.role === "admin" || user.role === "pastor") && (
          <MotionDiv variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Admin Analytics</h2>
            </div>
            <AdminDashboard userId={user._id} />
          </MotionDiv>
        )}

        {/* User Analytics Section */}
        <MotionDiv variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Your Dashboard Analytics</h2>
          </div>
          <DashboardAnalytics userId={user._id} />
        </MotionDiv>

        {/* Profile Status Card */}
        <MotionCard
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Status
                </CardTitle>
                <CardDescription>
                  {profile
                    ? "Your professional profile information"
                    : "You haven't created a professional profile yet"}
                </CardDescription>
              </div>
              {profile && getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Create your professional profile to be visible in the directory and connect with
                  other church members.
                </AlertDescription>
              </Alert>
            ) : profile.status === "pending" ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your profile is under review. You&apos;ll be notified once it&apos;s approved.
                </AlertDescription>
              </Alert>
            ) : profile.status === "rejected" ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {profile.rejectionReason || "Your profile was not approved. Please review and resubmit."}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your profile is live in the directory! Other members can now view and contact you.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              {!profile ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => router.push("/profile/create")}>
                    <User className="mr-2 h-4 w-4" />
                    Create Profile
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" onClick={() => router.push("/profile/edit")}>
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </MotionCard>

        {/* Quick Actions Grid */}
        <MotionDiv
          variants={containerVariants}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"
        >
          
      

          {(user.role === "admin" || user.role === "pastor") && (
            <>
              <MotionCard
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/admin/approvals")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Profile Approvals
                  </CardTitle>
                  <CardDescription>
                    Review and approve professional profiles
                  </CardDescription>
                </CardHeader>
              </MotionCard>
              <MotionCard
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/admin/account-approvals")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Approvals
                  </CardTitle>
                  <CardDescription>
                    Review and approve new user registrations
                  </CardDescription>
                </CardHeader>
              </MotionCard>
            </>
          )}
        </MotionDiv>

        {/* Role Badge */}
        <MotionCard
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm font-medium">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </CardContent>
        </MotionCard>
      </MotionDiv>
    </div>
  );
}
