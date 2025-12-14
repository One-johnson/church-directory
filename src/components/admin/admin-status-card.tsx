'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminStatusCardProps {
  className?: string;
}

export function AdminStatusCard({ className }: AdminStatusCardProps) {
  const adminStatus = useQuery(api.adminBootstrap.checkAdminStatus);

  if (adminStatus === undefined) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Loading admin information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Status
        </CardTitle>
        <CardDescription>
          Platform administration overview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Distribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <Badge variant="secondary">{adminStatus.totalUsers}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Admins</span>
            </div>
            <Badge variant={adminStatus.adminCount > 0 ? "default" : "destructive"}>
              {adminStatus.adminCount}
            </Badge>
          </div>
          
         
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Professionals</span>
            </div>
            <Badge variant="outline">{adminStatus.memberCount}</Badge>
          </div>
        </div>

        {/* Admin List */}
        {adminStatus.admins.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium">Platform Administrators</h4>
            <div className="space-y-1">
              {adminStatus.admins.map((admin, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 bg-secondary/50 rounded"
                >
                  <div>
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-muted-foreground">{admin.email}</p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Admin
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bootstrap Warning */}
        {adminStatus.needsBootstrap && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ No administrators found
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Register the first user to automatically become an admin, or use the Convex Dashboard to promote a user.
            </p>
          </div>
        )}

        {/* Success Message */}
        {!adminStatus.needsBootstrap && adminStatus.hasAdmins && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-xs text-green-700 dark:text-green-300">
              ✅ Platform is properly configured with {adminStatus.adminCount} administrator{adminStatus.adminCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
