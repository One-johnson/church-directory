"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Calendar, User, Mail, Phone, Eye } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

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

interface JobDetailDialogProps {
  job: JobOpportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailDialog({ job, open, onOpenChange }: JobDetailDialogProps): React.JSX.Element {
  const incrementViews = useMutation(api.jobOpportunities.incrementJobViews);
  const [hasIncrementedView, setHasIncrementedView] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open && !hasIncrementedView) {
      incrementViews({ jobId: job._id as Id<"jobOpportunities"> });
      setHasIncrementedView(true);
    }
  }, [open, hasIncrementedView, incrementViews, job._id]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              <Briefcase className="mr-1 h-3 w-3" />
              {job.professionalNeeded}
            </Badge>
            <DialogTitle className="text-2xl">{job.subject}</DialogTitle>
            <DialogDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Posted {formatDate(job.createdAt)}
              </span>
              {job.views !== undefined && job.views > 0 && (
                <span className="flex items-center">
                  <Eye className="mr-1 h-4 w-4" />
                  {job.views} {job.views === 1 ? "view" : "views"}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        {/* Description */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Job Description</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        <Separator />

        {/* Posted By */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Posted By</h3>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{job.posterName}</span>
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-emerald-600" />
              <a
                href={`mailto:${job.contactEmail}`}
                className="text-emerald-600 hover:underline"
              >
                {job.contactEmail}
              </a>
            </div>
            {job.contactPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-emerald-600" />
                <a
                  href={`tel:${job.contactPhone}`}
                  className="text-emerald-600 hover:underline"
                >
                  {job.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            className="flex-1"
            onClick={() => window.location.href = `mailto:${job.contactEmail}`}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          {job.contactPhone && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `tel:${job.contactPhone}`}
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
