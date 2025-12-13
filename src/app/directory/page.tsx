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
import { Button } from "@/components/ui/button";
import { Loader2, Users, Download } from "lucide-react";
import { EnhancedProfileCard } from "@/components/directory/enhanced-profile-card";
import { exportTableData } from "@/lib/export-utils";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

const MotionDiv = motion.div;
const MotionCard = motion(Card);

export default function DirectoryPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  usePresence(user?._id as Id<"users"> || null);

  const allProfiles = useQuery(api.profiles.getApprovedProfiles);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (allProfiles && searchResults.length === 0 && !authLoading) {
      setSearchResults(allProfiles);
    }
  }, [allProfiles, searchResults.length, authLoading]);

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
      data: searchResults.map(p => ({
        ...p,
        church: p.church || "N/A",
        denomination: p.denomination || "N/A",
      })),
    });
    toast.success(`Exported ${searchResults.length} profiles to ${format.toUpperCase()}`);
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
        <MotionDiv variants={itemVariants} className="flex items-start justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Professional Directory
            </h1>
            <p className="text-muted-foreground">
              Browse and connect with verified UD Professionals in our church community
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-2"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </motion.div>
          </motion.div>
        </MotionDiv>

        <MotionDiv variants={itemVariants}>
          <AdvancedSearch onResults={setSearchResults} />
        </MotionDiv>

        {!allProfiles && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {allProfiles && searchResults.length === 0 && (
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
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {searchResults.map((profile, index) => (
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
