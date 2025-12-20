"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface CreateJobSeekerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface JobSeekerFormData {
  subject: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
}

export function CreateJobSeekerForm({ onSuccess, onCancel }: CreateJobSeekerFormProps): React.JSX.Element {
  const { user } = useAuth();
  const createJobSeekerRequest = useMutation(api.jobSeekerRequests.createJobSeekerRequest);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobSeekerFormData>({
    defaultValues: {
      contactEmail: user?.email || "",
    },
  });

  const onSubmit = async (data: JobSeekerFormData): Promise<void> => {
    if (!user) {
      toast.error("You must be logged in to post a job seeking request");
      return;
    }

    try {
      await createJobSeekerRequest({
        userId: user._id as Id<"users">,
        subject: data.subject,
        description: data.description,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      });

      toast.success("Job seeking request submitted for approval!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to submit job seeking request. Please try again.");
      console.error("Error creating job seeker request:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-base font-semibold">
          Subject <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="subject"
            type="text"
            placeholder="e.g., Seeking Software Developer Position, Looking for Marketing Role..."
            {...register("subject", {
              required: "Subject is required",
            })}
            className={`pl-10 ${errors.subject ? "border-destructive" : ""}`}
          />
        </div>
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-semibold">
          Job Description / What You're Looking For <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Provide detailed information about your skills, experience, and what kind of opportunities you're seeking..."
          rows={6}
          {...register("description", {
            required: "Description is required",
            minLength: {
              value: 50,
              message: "Description must be at least 50 characters",
            },
          })}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="text-base font-semibold">
            Contact Email <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="contactEmail"
              type="email"
              placeholder="your.email@example.com"
              {...register("contactEmail", {
                required: "Contact email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className={`pl-10 ${errors.contactEmail ? "border-destructive" : ""}`}
            />
          </div>
          {errors.contactEmail && (
            <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
          )}
        </div>

        {/* Contact Phone (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="text-base font-semibold">
            Contact Phone <span className="text-muted-foreground text-sm">(Optional)</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+1 234 567 8900"
              {...register("contactPhone")}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Your job seeking request will be reviewed by admins before being published to the community.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit for Approval"
          )}
        </Button>
      </div>
    </form>
  );
}
