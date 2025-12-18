"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, Eye, Mail, Phone } from "lucide-react";
import { JobDetailDialog } from "./job-detail-dialog";

interface JobOpportunity {
  _id: string;
  _creationTime: number;
  userId: string;
  posterName: string;
  posterEmail: string;
  professionalNeeded: string;
  subject: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
  status: "pending" | "approved" | "rejected";
  views?: number;
  createdAt: number;
  updatedAt: number;
}

interface JobCardProps {
  job: JobOpportunity;
}

export function JobCard({ job }: JobCardProps): React.JSX.Element {
  const [detailDialogOpen, setDetailDialogOpen] = React.useState<boolean>(false);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const truncateDescription = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">
                <Briefcase className="mr-1 h-3 w-3" />
                {job.professionalNeeded}
              </Badge>
              <CardTitle className="text-xl line-clamp-2">{job.subject}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateDescription(job.description, 150)}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              Posted {formatDate(job.createdAt)}
            </div>
            {job.views !== undefined && job.views > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Eye className="mr-2 h-4 w-4" />
                {job.views} {job.views === 1 ? "view" : "views"}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Posted by:</p>
            <p className="text-sm font-medium">{job.posterName}</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => setDetailDialogOpen(true)}
          >
            View Details
          </Button>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.location.href = `mailto:${job.contactEmail}`}
            >
              <Mail className="mr-1 h-4 w-4" />
              Email
            </Button>
            {job.contactPhone && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.location.href = `tel:${job.contactPhone}`}
              >
                <Phone className="mr-1 h-4 w-4" />
                Call
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <JobDetailDialog
        job={job}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
