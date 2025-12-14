"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Clock,
  MessageSquare,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const MotionCard = motion(Card);

interface AdminDashboardProps {
  userId: string;
}

export function AdminDashboard({ userId }: AdminDashboardProps): React.JSX.Element {

  const { user } = useAuth();
    
  const analytics = useQuery(api.analytics.getAdminAnalytics, 
    user ? {requesterId: user._id } : "skip"
 );

  const verificationStats = useQuery(
  api.analytics.getVerificationAnalytics,
  user ? { requesterId: user._id } : "skip" // skip until user is loaded
);


  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (!analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-1/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: analytics.totalUsers,
      change: analytics.userGrowth > 0 ? `+${analytics.userGrowth}` : `${analytics.userGrowth}`,
      changeLabel: "this month",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Approved Profiles",
      value: analytics.approvedProfiles,
      change: analytics.approvalRate ? `${analytics.approvalRate.toFixed(0)}%` : "0%",
      changeLabel: "approval rate",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pending Approvals",
      value: analytics.pendingProfiles,
      change: analytics.pendingProfiles > 0 ? "Action needed" : "All caught up",
      changeLabel: "",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Total Messages",
      value: analytics.totalMessages,
      change: analytics.totalMessages > 0 ? `+${analytics.totalMessages}` : `${analytics.totalMessages}`,
      changeLabel: "this month",
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const roleCards = [
    {
      title: "Admins",
      value: analytics.adminCount,
      icon: Shield,
      percentage: ((analytics.adminCount / analytics.totalUsers) * 100).toFixed(1),
      color: "text-red-500",
      bgGradient: "from-red-500/10 to-pink-500/10",
    },
  
    {
      title: "Professionals",
      value: analytics.memberCount,
      icon: Users,
      percentage: ((analytics.memberCount / analytics.totalUsers) * 100).toFixed(1),
      color: "text-blue-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Platform Overview */}
      <div>
        <motion.div variants={fadeInUp} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Platform Overview</h2>
          </div>
          <p className="text-muted-foreground">
            Real-time insights into the Professional Directory platform
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <MotionCard
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.02, y: -5 }}
              className="overflow-hidden relative"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full blur-3xl opacity-20`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="font-medium">{stat.title}</CardDescription>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: index * 0.1 }}
                  className="text-3xl font-bold mb-1"
                >
                  {stat.value}
                </motion.div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="font-normal">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </Badge>
                  {stat.changeLabel && (
                    <span className="text-muted-foreground">{stat.changeLabel}</span>
                  )}
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </div>

      {/* User Distribution */}
      <motion.div variants={fadeInUp}>
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">User Role Distribution</h3>
          <p className="text-sm text-muted-foreground">
            Breakdown of users by their assigned roles
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roleCards.map((role, index) => (
            <MotionCard
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              className="overflow-hidden relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-50`} />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <role.icon className={`h-8 w-8 ${role.color}`} />
                  <Badge variant="outline" className="text-xs">
                    {role.percentage}%
                  </Badge>
                </div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {role.title}
                </h4>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: index * 0.1 }}
                  className="text-3xl font-bold"
                >
                  {role.value}
                </motion.p>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </motion.div>

      {/* Verification Analytics */}
      {verificationStats && (
        <motion.div variants={fadeInUp}>
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Verification Status
                  </CardTitle>
                  <CardDescription>Platform-wide verification badge distribution</CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {verificationStats.fullyVerified} Verified
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Email Verified", count: verificationStats.emailVerified, color: "bg-blue-500" },
                  { label: "Phone Verified", count: verificationStats.phoneVerified, color: "bg-green-500" },
                  { label: "Pastor Endorsed", count: verificationStats.pastorEndorsed, color: "bg-purple-500" },
                  { label: "Background Check", count: verificationStats.backgroundCheck, color: "bg-amber-500" },
                ].map((badge, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{badge.label}</span>
                      <span className="font-medium">{badge.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(badge.count / verificationStats.totalProfiles) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-full ${badge.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Status */}
      <motion.div variants={fadeInUp}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className={analytics.pendingProfiles > 0 ? "border-amber-500/50" : "border-green-500/50"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {analytics.pendingProfiles > 0 ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                Approval Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {analytics.pendingProfiles > 0
                  ? `You have ${analytics.pendingProfiles} profile${analytics.pendingProfiles === 1 ? '' : 's'} waiting for review.`
                  : "All profiles have been reviewed. Great job!"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {analytics.userGrowth >= 0 ? "Growing community" : "Stable user base"} with{" "}
                {analytics.approvalRate ? `${analytics.approvalRate.toFixed(0)}%` : "0%"} approval rate and{" "}
                {analytics.totalMessages} total messages exchanged.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
