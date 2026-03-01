"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";

import { AdvancedSearch } from "@/components/search/advanced-search";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { EnhancedProfileCard, ProfileCardSkeleton } from "@/components/directory/enhanced-profile-card";
import type { Id } from "../../../convex/_generated/dataModel";

const MotionDiv = motion.div;
const MotionCard = motion(Card);

export default function DirectoryPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = React.useState(false);

  usePresence(user?._id as Id<"users"> || null);

  const allProfiles = useQuery(api.profiles.getApprovedProfiles);

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

  const handleMessage = (profileUserId: string): void => {
    router.push(`/messages?to=${profileUserId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto p-4 md:p-8 space-y-6"
      >
        <MotionDiv variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Professional Directory
          </h1>
          <p className="text-muted-foreground">
            Browse and connect with verified professionals in the UD Professionals Directory
          </p>
        </MotionDiv>

        <MotionDiv variants={itemVariants}>
          <AdvancedSearch
            onResults={setSearchResults}
            allProfiles={allProfiles ?? undefined}
            onSearchActiveChange={setIsSearchActive}
          />
        </MotionDiv>

        {isSearchActive && searchResults.length === 0 && (
          <MotionCard
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No professionals found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search filters
              </p>
            </CardContent>
          </MotionCard>
        )}

        <MotionDiv
          variants={containerVariants}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 lg:gap-6"
        >
          {!allProfiles
            ? Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ProfileCardSkeleton />
                </motion.div>
              ))
            : searchResults.map((profile) => (
                <motion.div
                  key={profile._id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <EnhancedProfileCard
                    profile={profile}
                    onMessage={handleMessage}
                    currentUserId={user._id}
                  />
                </motion.div>
              ))}
        </MotionDiv>
      </MotionDiv>
    </div>
  );
}
