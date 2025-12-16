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
  role: "admin" | "member";
  emailVerified: boolean;
  createdAt: number;
  denomination: string;
  denominationName: string;
  branch: string;
  branchName: string;
  branchLocation: string;
  pastor: string;
  pastorEmail: string;
  accountApprovedBy?: string | Id<"users">;
  accountApprovedAt: number;
}

interface AccountStatusCardProps {
  user: User;
}

export function AccountStatusCard({ user }: AccountStatusCardProps): React.JSX.Element {
  const router = useRouter();

  // If user exists in the users table, they are always approved
  // (Pending users are in the pendingUsers table, not users table)
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
