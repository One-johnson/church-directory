"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Plus, Search, Loader2, Sparkles, UserSearch } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { CreateJobForm } from "@/components/jobs/create-job-form";
import { JobSeekerCard } from "@/components/jobs/job-seeker-card";
import { CreateJobSeekerForm } from "@/components/jobs/create-job-seeker-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const MotionDiv = motion.div;
const MotionCard = motion(Card);

export default function JobsPage(): React.JSX.Element {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<string>("opportunities");
  const [createJobDialogOpen, setCreateJobDialogOpen] = React.useState<boolean>(false);
  const [createSeekerDialogOpen, setCreateSeekerDialogOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const jobs = useQuery(api.jobOpportunities.getApprovedJobOpportunities);
  const seekers = useQuery(api.jobSeekerRequests.getApprovedJobSeekerRequests);

  const filteredJobs = React.useMemo(() => {
    if (!jobs) return [];
    if (!searchQuery.trim()) return jobs;

    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.professionalNeeded.toLowerCase().includes(query) ||
        job.subject.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  const filteredSeekers = React.useMemo(() => {
    if (!seekers) return [];
    if (!searchQuery.trim()) return seekers;

    const query = searchQuery.toLowerCase();
    return seekers.filter(
      (seeker) =>
        seeker.subject.toLowerCase().includes(query) ||
        seeker.description.toLowerCase().includes(query) ||
        seeker.seekerName.toLowerCase().includes(query)
    );
  }, [seekers, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto p-4 md:p-8 pt-6 md:pt-8 space-y-6"
      >
        {/* Header Section */}
        <MotionDiv variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-1"
          >
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="h-8 w-8" />
              Job Opportunities
            </h1>
            <p className="text-muted-foreground">
              Connect with professionals in our community
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2 w-full md:w-auto"
          >
            {user && activeTab === "opportunities" && (
              <Button onClick={() => setCreateJobDialogOpen(true)} size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Post Job
              </Button>
            )}
            {user && activeTab === "seekers" && (
              <Button onClick={() => setCreateSeekerDialogOpen(true)} size="lg" variant="secondary" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Seek Job
              </Button>
            )}
          </motion.div>
        </MotionDiv>

        {/* Tabs */}
        <MotionDiv variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="opportunities" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Opportunities
              </TabsTrigger>
              <TabsTrigger value="seekers" className="flex items-center gap-2">
                <UserSearch className="h-4 w-4" />
                Job Seekers
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="relative mt-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  activeTab === "opportunities"
                    ? "Search for professionals, subjects, or descriptions..."
                    : "Search for job seekers, skills, or descriptions..."
                }
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Job Opportunities Tab */}
            <TabsContent value="opportunities" className="mt-6">
              {/* Loading State */}
              {!jobs && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Empty State */}
              {jobs && filteredJobs.length === 0 && !searchQuery && (
                <MotionCard
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No job opportunities yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Be the first to post a job opportunity!
                    </p>
                    {user && (
                      <Button onClick={() => setCreateJobDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Post Now
                      </Button>
                    )}
                  </CardContent>
                </MotionCard>
              )}

              {/* No Search Results */}
              {jobs && filteredJobs.length === 0 && searchQuery && (
                <MotionCard
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search query
                    </p>
                  </CardContent>
                </MotionCard>
              )}

              {/* Jobs Grid */}
              {jobs && filteredJobs.length > 0 && (
                <AnimatePresence>
                  <MotionDiv
                    variants={containerVariants}
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {filteredJobs.map((job, index: number) => (
                      <motion.div
                        key={job._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <JobCard job={job} />
                      </motion.div>
                    ))}
                  </MotionDiv>
                </AnimatePresence>
              )}
            </TabsContent>

            {/* Job Seekers Tab */}
            <TabsContent value="seekers" className="mt-6">
              {/* Loading State */}
              {!seekers && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Empty State */}
              {seekers && filteredSeekers.length === 0 && !searchQuery && (
                <MotionCard
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <UserSearch className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No job seekers yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Be the first to post your job seeking request!
                    </p>
                    {user && (
                      <Button onClick={() => setCreateSeekerDialogOpen(true)} variant="secondary">
                        <Plus className="mr-2 h-4 w-4" />
                        Seek Job Now
                      </Button>
                    )}
                  </CardContent>
                </MotionCard>
              )}

              {/* No Search Results */}
              {seekers && filteredSeekers.length === 0 && searchQuery && (
                <MotionCard
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search query
                    </p>
                  </CardContent>
                </MotionCard>
              )}

              {/* Job Seekers Grid */}
              {seekers && filteredSeekers.length > 0 && (
                <AnimatePresence>
                  <MotionDiv
                    variants={containerVariants}
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {filteredSeekers.map((seeker, index: number) => (
                      <motion.div
                        key={seeker._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <JobSeekerCard seeker={seeker} />
                      </motion.div>
                    ))}
                  </MotionDiv>
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </MotionDiv>
      </MotionDiv>

      {/* Create Job Opportunity Dialog */}
      <Dialog open={createJobDialogOpen} onOpenChange={setCreateJobDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a Job Opportunity</DialogTitle>
          </DialogHeader>
          <CreateJobForm
            onSuccess={() => setCreateJobDialogOpen(false)}
            onCancel={() => setCreateJobDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Job Seeker Dialog */}
      <Dialog open={createSeekerDialogOpen} onOpenChange={setCreateSeekerDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Job Seeking Request</DialogTitle>
          </DialogHeader>
          <CreateJobSeekerForm
            onSuccess={() => setCreateSeekerDialogOpen(false)}
            onCancel={() => setCreateSeekerDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
