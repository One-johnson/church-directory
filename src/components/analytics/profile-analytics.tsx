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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  Briefcase,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ProfileAnalyticsProps {
  userId: Id<"users">;
}

export function ProfileAnalytics({
  userId,
}: ProfileAnalyticsProps): React.JSX.Element {
  const analytics = useQuery(api.analytics.getProfileAnalytics, {
    requesterId: userId,
  });

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
      title: "Total Profiles",
      value: analytics.totalProfiles,
      description: "All submissions",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Pending Review",
      value: analytics.pendingProfiles,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Approved",
      value: analytics.approvedProfiles,
      description: "Live in directory",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Rejected",
      value: analytics.rejectedProfiles,
      description: "Not approved",
      icon: XCircle,
      color: "text-red-600",
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

      {/* Activity Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Submissions</span>
              <Badge variant="secondary" className="text-lg">
                {analytics.recentSubmissions}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg. Approval Time</span>
              <Badge variant="outline" className="text-lg">
                {analytics.avgApprovalHours}h
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Professions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Top Professions
            </CardTitle>
            <CardDescription>Most common skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topProfessions.map((item, index) => (
                <div
                  key={item.profession}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {item.profession}
                    </span>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Locations */}
      {analytics.topLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Locations
            </CardTitle>
            <CardDescription>Most active regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topLocations.map((item, index) => (
                <div
                  key={item.location}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">{item.location}</span>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
