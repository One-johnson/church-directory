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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Calendar, Eye } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

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

interface JobSeekerDetailDialogProps {
  seeker: JobSeeker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobSeekerDetailDialog({
  seeker,
  open,
  onOpenChange,
}: JobSeekerDetailDialogProps): React.JSX.Element {
  const incrementViews = useMutation(api.jobSeekerRequests.incrementJobSeekerViews);

  React.useEffect(() => {
    if (open && seeker._id) {
      incrementViews({ seekerId: seeker._id }).catch((error) => {
        console.error("Failed to increment job seeker views:", error);
      });
    }
  }, [open, seeker._id, incrementViews]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-black">{seeker.subject}</DialogTitle>
              <DialogDescription className="mt-2">
                Posted by {seeker.seekerName}
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="shrink-0">
              <User className="h-3 w-3 mr-1" />
              Seeking
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Posted By Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Job Seeker
            </h3>
            <div className="flex items-center gap-2 text-black">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{seeker.seekerName}</span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Description & Skills
            </h3>
            <p className="text-black whitespace-pre-wrap leading-relaxed">
              {seeker.description}
            </p>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-black">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${seeker.contactEmail}`}
                  className="hover:underline text-blue-600"
                >
                  {seeker.contactEmail}
                </a>
              </div>
              {seeker.contactPhone && (
                <div className="flex items-center gap-2 text-black">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={`tel:${seeker.contactPhone}`}
                    className="hover:underline text-blue-600"
                  >
                    {seeker.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Posted {formatDate(seeker.createdAt)}</span>
            </div>
            {seeker.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{seeker.views} views</span>
              </div>
            )}
          </div>

          {/* Contact Button */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                window.location.href = `mailto:${seeker.contactEmail}`;
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Job Seeker
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
