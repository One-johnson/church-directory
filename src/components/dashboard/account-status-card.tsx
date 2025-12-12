"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Church, MapPin, Mail, User as UserIcon } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface User {
  _id: Id<"users">;
  email: string;
  phone?: string;
  name: string;
  role: "admin" | "pastor" | "member";
  emailVerified: boolean;
  createdAt: number;
  denomination: string;
  denominationName: string;
  branch: string;
  branchName: string;
  branchLocation: string;
  pastor: string;
  pastorEmail: string;
  accountApproved: boolean;
  accountRejectionReason?: string;
}

interface AccountStatusCardProps {
  user: User;
}

export function AccountStatusCard({ user }: AccountStatusCardProps): React.JSX.Element {
  const router = useRouter();

  if (user.accountApproved) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <CardTitle>Account Approved</CardTitle>
          </div>
          <CardDescription>Your account is active and ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Church className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{user.denominationName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {user.branchName} - {user.branchLocation}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pastor: {user.pastor}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user.accountRejectionReason) {
    return (
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <CardTitle>Account Requires Attention</CardTitle>
          </div>
          <CardDescription>Please contact your church administrator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Reason:</strong> {user.accountRejectionReason}
            </AlertDescription>
          </Alert>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Contact your pastor for assistance:</p>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <a href={`mailto:${user.pastorEmail}`} className="text-primary hover:underline">
                {user.pastorEmail}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <CardTitle>Account Pending Approval</CardTitle>
        </div>
        <CardDescription>
          Your registration is being reviewed by church leadership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Your account has been submitted for approval. You will receive a notification once an
            admin or pastor reviews your registration. In the meantime, you can explore the app but
            cannot create a professional profile yet.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Your Registration Details:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Church className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{user.denominationName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {user.branchName} - {user.branchLocation}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reviewing Pastor: {user.pastor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.pastorEmail}</span>
            </div>
          </div>
        </div>

        {(user.role === "admin" || user.role === "pastor") && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/admin/account-approvals")}
          >
            View Pending Approvals
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
