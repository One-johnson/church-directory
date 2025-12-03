"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";
import { AppNavbar } from "@/components/layout/app-navbar";
import { AdvancedSearch } from "@/components/search/advanced-search";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Loader2, Users, Download } from "lucide-react";
import { exportTableData } from "@/lib/export-utils";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

export default function DirectoryPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  usePresence((user?._id as Id<"users">) || null);

  const allProfiles = useQuery(api.profiles.getApprovedProfiles);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (allProfiles && searchResults.length === 0) {
      setSearchResults(allProfiles);
    }
  }, [allProfiles, searchResults.length]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleMessage = (profileUserId: string): void => {
    router.push(`/messages?to=${profileUserId}`);
  };

  const handleExport = (format: "csv" | "pdf") => {
    exportTableData(format, {
      filename: `church-directory-${new Date().toISOString().split("T")[0]}`,
      title: "Church Professional Directory",
      columns: [
        { header: "Name", key: "name" },
        { header: "Profession", key: "profession" },
        { header: "Category", key: "category" },
        { header: "Skills", key: "skills" },
        { header: "Location", key: "location" },
        { header: "Country", key: "country" },
        { header: "Experience", key: "experience" },
      ],
      data: searchResults,
    });
    toast.success(
      `Exported ${searchResults.length} profiles to ${format.toUpperCase()}`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Professional Directory
            </h1>
            <p className="text-muted-foreground">
              Browse and connect with verified professionals in our church
              community
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <AdvancedSearch onResults={setSearchResults} />

        {!allProfiles && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {allProfiles && searchResults.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No professionals found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search filters
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {searchResults.map((profile) => {
            const userPresence = profile.user?.isOnline;

            return (
              <Card
                key={profile._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={profile.profilePicture}
                          alt={profile.name}
                        />
                        <AvatarFallback>
                          {profile.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {userPresence && (
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-xl">{profile.name}</CardTitle>
                      <CardDescription className="font-medium">
                        {profile.profession}
                      </CardDescription>
                      <Badge variant="secondary" className="text-xs">
                        {profile.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Skills:</span>
                      <p className="text-muted-foreground line-clamp-2">
                        {profile.skills}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>
                      <p className="text-muted-foreground">
                        {profile.location}, {profile.country}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Experience:</span>
                      <p className="text-muted-foreground line-clamp-2">
                        {profile.experience}
                      </p>
                    </div>
                  </div>

                  {user._id !== profile.userId && (
                    <Button
                      className="w-full"
                      onClick={() => handleMessage(profile.userId)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
