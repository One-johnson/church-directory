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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  MessageSquare,
  Bell,
  CheckCircle,
  TrendingUp,
  Mail,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface DashboardAnalyticsProps {
  userId: Id<"users">;
}

export function DashboardAnalytics({
  userId,
}: DashboardAnalyticsProps): React.JSX.Element {
  const analytics = useQuery(api.analytics.getDashboardAnalytics, { userId });

  if (!analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
      title: "Messages Sent",
      value: analytics.totalSentMessages,
      description: "Total messages sent",
      icon: MessageSquare,
      color: "text-blue-600",
    },
    {
      title: "Messages Received",
      value: analytics.totalReceivedMessages,
      description: `${analytics.unreadMessages} unread`,
      icon: Mail,
      color: "text-green-600",
      badge:
        analytics.unreadMessages > 0 ? analytics.unreadMessages : undefined,
    },
    {
      title: "Notifications",
      value: analytics.unreadNotifications,
      description: "Unread notifications",
      icon: Bell,
      color: "text-orange-600",
      badge:
        analytics.unreadNotifications > 0
          ? analytics.unreadNotifications
          : undefined,
    },
    {
      title: "Professionals",
      value: analytics.totalProfessionals,
      description: "Active in directory",
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="relative">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {stat.badge}
                  </Badge>
                )}
              </div>
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

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Your Profile Status
          </CardTitle>
          <CardDescription>Current status and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profile Created</span>
            <Badge variant={analytics.hasProfile ? "default" : "secondary"}>
              {analytics.hasProfile ? "Yes" : "No"}
            </Badge>
          </div>
          {analytics.hasProfile && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge
                variant={
                  analytics.profileStatus === "approved"
                    ? "default"
                    : analytics.profileStatus === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {analytics.profileStatus}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">Community Members</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-bold">
                {analytics.totalProfessionals}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
