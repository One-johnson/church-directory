"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppNavbar } from "@/components/layout/app-navbar";
import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CreateProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container mx-auto p-4 md:p-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Professional Profile</CardTitle>
            <CardDescription>
              Fill out your professional information to be featured in the
              church directory. Your profile will be reviewed before being
              published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user._id}
              onSuccess={() => router.push("/dashboard")}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
