"use client";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  MapPin, 
  Briefcase, 
  Award, 
  Building2, 
  Church as ChurchIcon,
  User 
} from "lucide-react";
import { VerificationBadges } from "@/components/profile/verification-badges";
import React from "react";

interface ProfileDetailDialogProps {
  profile: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessage?: () => void;
  showMessageButton?: boolean;
}

export function ProfileDetailDialog({
  profile,
  open,
  onOpenChange,
  onMessage,
  showMessageButton = true,
}: ProfileDetailDialogProps): React.JSX.Element {
  if (!profile) return <></>;

  const initials = profile.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profilePicture} alt={profile.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl">{profile.name}</DialogTitle>
              <DialogDescription className="text-base font-medium">
                {profile.profession}
              </DialogDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm">
                  {profile.category}
                </Badge>
                {profile.user?.isOnline && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <div className="h-2 w-2 bg-green-600 rounded-full mr-1.5" />
                    Online
                  </Badge>
                )}
              </div>
              <VerificationBadges
                emailVerified={profile.emailVerified}
                phoneVerified={profile.phoneVerified}
                pastorEndorsed={profile.pastorEndorsed}
                backgroundCheck={profile.backgroundCheck}
                size="md"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact & Location Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {profile.location}, {profile.country}
                </p>
              </div>
            </div>

            {profile.church && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <ChurchIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Church</p>
                  <p className="text-sm text-muted-foreground">{profile.church}</p>
                </div>
              </div>
            )}

            {profile.denomination && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Denomination</p>
                  <p className="text-sm text-muted-foreground">{profile.denomination}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Skills */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Skills & Expertise</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{profile.skills}</p>
          </div>

          <Separator />

          {/* Experience */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Work Experience</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.experience}
            </p>
          </div>

          <Separator />

          {/* Services Offered */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Services Offered</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.servicesOffered}
            </p>
          </div>

          {showMessageButton && onMessage && (
            <>
              <Separator />
              <Button onClick={onMessage} size="lg" className="w-full">
                <Mail className="mr-2 h-5 w-5" />
                Send Message to {profile.name}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
