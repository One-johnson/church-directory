"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Phone, Shield, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface VerificationManagerProps {
  profile: any;
  requesterId: Id<"users">;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function VerificationManager({
  profile,
  requesterId,
  trigger,
  onSuccess,
}: VerificationManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState(profile.emailVerified || false);
  const [phoneVerified, setPhoneVerified] = React.useState(profile.phoneVerified || false);
  const [pastorEndorsed, setPastorEndorsed] = React.useState(profile.pastorEndorsed || false);
  const [backgroundCheck, setBackgroundCheck] = React.useState(profile.backgroundCheck || false);
  const [notes, setNotes] = React.useState(profile.verificationNotes || "");

  const updateVerifications = useMutation(api.verifications.updateVerificationBadges);

  const handleSave = async () => {
    try {
      await updateVerifications({
        requesterId,
        profileId: profile._id,
        emailVerified,
        phoneVerified,
        pastorEndorsed,
        backgroundCheck,
        verificationNotes: notes || undefined,
      });

      toast.success("Verification badges updated successfully");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update verifications");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="mr-2 h-4 w-4" />
            Manage Verifications
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Verification Badges</DialogTitle>
          <DialogDescription>
            Update verification status for {profile.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email"
              checked={emailVerified}
              onCheckedChange={(checked) => setEmailVerified(checked as boolean)}
            />
            <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
              <Mail className="h-4 w-4 text-blue-600" />
              Email Verified
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="phone"
              checked={phoneVerified}
              onCheckedChange={(checked) => setPhoneVerified(checked as boolean)}
            />
            <Label htmlFor="phone" className="flex items-center gap-2 cursor-pointer">
              <Phone className="h-4 w-4 text-green-600" />
              Phone Verified
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pastor"
              checked={pastorEndorsed}
              onCheckedChange={(checked) => setPastorEndorsed(checked as boolean)}
            />
            <Label htmlFor="pastor" className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-4 w-4 text-purple-600" />
              Pastor Endorsed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="background"
              checked={backgroundCheck}
              onCheckedChange={(checked) => setBackgroundCheck(checked as boolean)}
            />
            <Label htmlFor="background" className="flex items-center gap-2 cursor-pointer">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              Background Check Completed
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Verification Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the verification process..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
