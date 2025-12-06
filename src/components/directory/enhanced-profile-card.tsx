"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, 
  MapPin, 
  Briefcase, 
  Award, 
  Info,
  Building2,
  Church as ChurchIcon
} from "lucide-react";
import { VerificationBadges } from "@/components/profile/verification-badges";
import { ProfileDetailDialog } from "./profile-detail-dialog";
import { cn } from "@/lib/utils";

interface EnhancedProfileCardProps {
  profile: any;
  onMessage: (userId: string) => void;
  currentUserId?: string;
}

export function EnhancedProfileCard({
  profile,
  onMessage,
  currentUserId,
}: EnhancedProfileCardProps): React.JSX.Element {
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);

  const initials = profile.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Calculate how many optional fields are filled
  const hasChurch = !!profile.church;
  const hasDenomination = !!profile.denomination;
  const hasProfilePicture = !!profile.profilePicture;
  const hasVerification = 
    profile.emailVerified || 
    profile.phoneVerified || 
    profile.pastorEndorsed || 
    profile.backgroundCheck;

  // Determine card size based on filled fields
  const filledOptionalFields = [
    hasChurch,
    hasDenomination,
    hasProfilePicture,
    hasVerification,
  ].filter(Boolean).length;

  // Card grows slightly with more details, but stays within limits
  const cardClassName = cn(
    "hover:shadow-lg transition-all duration-200",
    filledOptionalFields >= 3 && "ring-2 ring-primary/20"
  );

  const userPresence = profile.user?.isOnline;
  const canMessage = currentUserId && currentUserId !== profile.userId;

  return (
    <>
      <Card className={cardClassName}>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.profilePicture} alt={profile.name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              {userPresence && (
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                {profile.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                {profile.profession}
              </p>
              <Badge variant="secondary" className="text-xs">
                {profile.category}
              </Badge>
              {hasVerification && (
                <VerificationBadges
                  emailVerified={profile.emailVerified}
                  phoneVerified={profile.phoneVerified}
                  pastorEndorsed={profile.pastorEndorsed}
                  backgroundCheck={profile.backgroundCheck}
                  size="sm"
                />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Always show location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-1">
              {profile.location}, {profile.country}
            </span>
          </div>

          {/* Show skills */}
          <div className="flex items-start gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-2">{profile.skills}</span>
          </div>

          {/* Show experience preview */}
          <div className="flex items-start gap-2 text-sm">
            <Award className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-1">{profile.experience}</span>
          </div>

          {/* Show church if available */}
          {hasChurch && (
            <div className="flex items-start gap-2 text-sm">
              <ChurchIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground line-clamp-1">{profile.church}</span>
            </div>
          )}

          {/* Show denomination if available */}
          {hasDenomination && (
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground line-clamp-1">{profile.denomination}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDetailDialog(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              View Details
            </Button>
            {canMessage && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onMessage(profile.userId)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Message
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ProfileDetailDialog
        profile={profile}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onMessage={canMessage ? () => {
          setShowDetailDialog(false);
          onMessage?.(profile.userId);
        } : undefined}
        showMessageButton={!!canMessage}
      />
    </>
  );
}
