"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, Shield, CheckCircle2, Users } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface VerificationAnalyticsProps {
  userId: Id<"users">;
}

export function VerificationAnalytics({ userId }: VerificationAnalyticsProps) {
  const stats = useQuery(api.verifications.getVerificationStats, { requesterId: userId });

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const verificationTypes = [
    {
      icon: Mail,
      label: "Email Verified",
      count: stats.emailVerified,
      total: stats.total,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Phone,
      label: "Phone Verified",
      count: stats.phoneVerified,
      total: stats.total,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Shield,
      label: "Pastor Endorsed",
      count: stats.pastorEndorsed,
      total: stats.total,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: CheckCircle2,
      label: "Background Check",
      count: stats.backgroundCheck,
      total: stats.total,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verification Statistics
        </CardTitle>
        <CardDescription>
          Profile verification badge distribution across all approved professionals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fully Verified Badge */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-full">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Fully Verified Profiles</p>
              <p className="text-xs text-green-700">All badges completed</p>
            </div>
          </div>
          <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
            {stats.fullyVerified}
          </Badge>
        </div>

        {/* Individual Verification Types */}
        <div className="space-y-4">
          {verificationTypes.map((type) => {
            const percentage = stats.total > 0 ? (type.count / type.total) * 100 : 0;
            
            return (
              <div key={type.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${type.bgColor}`}>
                      <type.icon className={`h-4 w-4 ${type.color}`} />
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {type.count} / {type.total}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Profiles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.total > 0 ? ((stats.fullyVerified / stats.total) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Fully Verified</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
