"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function EditProfilePage(): React.JSX.Element {
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

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <main className="container mx-auto p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <main className="container mx-auto p-4 md:p-8 max-w-3xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have a profile yet. Please create one first.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container mx-auto p-4 md:p-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Professional Profile</CardTitle>
            <CardDescription>
              Update your professional information. Changes will need to be
              reviewed before being published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user._id}
              profileId={profile._id}
              defaultValues={{
                name: profile.name,
                skills: profile.skills,
                profession: profile.profession,
                category: profile.category,
                experience: profile.experience,
                servicesOffered: profile.servicesOffered,
                location: profile.location,
                profilePicture: profile.profilePicture,
                country: profile.country,
              }}
              onSuccess={() => router.push("/dashboard")}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
