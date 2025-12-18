"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Eye, Calendar } from "lucide-react";
import { JobSeekerDetailDialog } from "./job-seeker-detail-dialog";
import type { Id } from "../../../convex/_generated/dataModel";

const MotionCard = motion(Card);

interface JobSeeker {
  _id: Id<"jobSeekerRequests">;
  userId: Id<"users">;
  seekerName: string;
  seekerEmail: string;
  subject: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  approvedBy?: Id<"users">;
  approvedAt?: number;
  views?: number;
  createdAt: number;
  updatedAt: number;
}

interface JobSeekerCardProps {
  seeker: JobSeeker;
}

export function JobSeekerCard({ seeker }: JobSeekerCardProps): React.JSX.Element {
  const [detailDialogOpen, setDetailDialogOpen] = React.useState<boolean>(false);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <MotionCard
        whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden border-l-4 border-l-sky-500 hover:border-l-sky-600"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black line-clamp-2">
                {seeker.subject}
              </h3>
            </div>
            <Badge variant="secondary" className="shrink-0">
              <User className="h-3 w-3 mr-1" />
              Seeking
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{seeker.seekerName}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateText(seeker.description, 150)}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(seeker.createdAt)}</span>
            </div>
            {seeker.views !== undefined && seeker.views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{seeker.views} views</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3">
          <Button
            onClick={() => setDetailDialogOpen(true)}
            variant="default"
            size="sm"
            className="w-full"
          >
            View Details
          </Button>
        </CardFooter>
      </MotionCard>

      <JobSeekerDetailDialog
        seeker={seeker}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
