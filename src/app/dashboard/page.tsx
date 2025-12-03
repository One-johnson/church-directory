"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { AppNavbar } from "@/components/layout/app-navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { JSX } from "react";

export default function DashboardPage(): JSX.Element {
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

  const getStatusBadge = (): JSX.Element => {
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

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your professional profile and connect with the community
          </p>
        </div>

        {/* Analytics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Your Dashboard Analytics</h2>
          </div>
          <DashboardAnalytics userId={user._id} />
        </div>

        {/* Profile Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
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
                  Create your professional profile to be visible in the
                  directory and connect with other church members.
                </AlertDescription>
              </Alert>
            ) : profile.status === "pending" ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your profile is under review. You&apos;ll be notified once
                  it&apos;s approved.
                </AlertDescription>
              </Alert>
            ) : profile.status === "rejected" ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {profile.rejectionReason ||
                    "Your profile was not approved. Please review and resubmit."}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your profile is live in the directory! Other members can now
                  view and contact you.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              {!profile ? (
                <Button onClick={() => router.push("/profile/create")}>
                  <User className="mr-2 h-4 w-4" />
                  Create Profile
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => router.push("/profile/edit")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/directory")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Browse Directory
              </CardTitle>
              <CardDescription>
                Find and connect with other professionals in the church
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/messages")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>
                View and send messages to other members
              </CardDescription>
            </CardHeader>
          </Card>

          {(user.role === "admin" || user.role === "pastor") && (
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/admin/approvals")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve professional profiles
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Role Badge */}
        <Card>
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
        </Card>
      </main>
    </div>
  );
}
