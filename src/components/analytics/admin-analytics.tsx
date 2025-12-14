"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface AdminAnalyticsProps {
  userId: Id<"users">;
}

export function AdminAnalytics({ userId }: AdminAnalyticsProps): React.JSX.Element {
  const analytics = useQuery(api.analytics.getAdminAnalytics, {
    requesterId: userId,
  });

  if (!analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics.totalUsers,
      description: `+${analytics.userGrowth} in last 30 days`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Profiles",
      value: analytics.totalProfiles,
      description: `${analytics.approvalRate}% approval rate`,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Pending Approvals",
      value: analytics.pendingProfiles,
      description: "Awaiting review",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Total Messages",
      value: analytics.totalMessages,
      description: `${analytics.unreadMessages} unread`,
      icon: MessageSquare,
      color: "text-green-600",
    },
  ];

  const roleStats = [
    {
      title: "Admins",
      value: analytics.adminCount,
      icon: Shield,
      color: "text-red-600",
    },
 
    {
      title: "Members",
      value: analytics.memberCount,
      icon: Users,
      color: "text-gray-600",
    },
  ];

  const profileStatusStats = [
    {
      title: "Approved",
      value: analytics.approvedProfiles,
      icon: CheckCircle,
      color: "text-green-600",
      percentage:
        analytics.totalProfiles > 0
          ? Math.round(
              (analytics.approvedProfiles / analytics.totalProfiles) * 100
            )
          : 0,
    },
    {
      title: "Rejected",
      value: analytics.rejectedProfiles,
      icon: XCircle,
      color: "text-red-600",
      percentage:
        analytics.totalProfiles > 0
          ? Math.round(
              (analytics.rejectedProfiles / analytics.totalProfiles) * 100
            )
          : 0,
    },
    {
      title: "Pending",
      value: analytics.pendingProfiles,
      icon: Clock,
      color: "text-orange-600",
      percentage:
        analytics.totalProfiles > 0
          ? Math.round(
              (analytics.pendingProfiles / analytics.totalProfiles) * 100
            )
          : 0,
    },
  ];

  return (
    <>
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Role Distribution
          </CardTitle>
          <CardDescription>User roles across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {roleStats.map((stat) => (
              <div key={stat.title} className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Profile Status Overview
          </CardTitle>
          <CardDescription>
            Distribution of profile approval statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileStatusStats.map((stat) => (
            <div key={stat.title} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm font-medium">{stat.title}</span>
                </div>
                <span className="text-sm font-bold">
                  {stat.value} ({stat.percentage}%)
                </span>
              </div>
              <Progress value={stat.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      {analytics.categoryDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Professional Categories
            </CardTitle>
            <CardDescription>
              Most popular professional categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.categoryDistribution
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.category}
                      </span>
                      <span className="text-sm font-bold">{item.count}</span>
                    </div>
                    <Progress
                      value={
                        analytics.totalProfiles > 0
                          ? (item.count / analytics.totalProfiles) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
