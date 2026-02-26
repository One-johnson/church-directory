"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Mail, Info } from "lucide-react";
import { ProfileDetailDialog } from "./profile-detail-dialog";

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

  const userPresence = profile.user?.isOnline;
  const canMessage = currentUserId && currentUserId !== profile.userId;

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 flex flex-col h-full">
        <CardHeader className="pb-1 pt-2 px-3 md:pb-2 md:pt-4 md:px-4">
          <div className="flex flex-col items-center gap-1.5 text-center md:gap-2">
            <div className="relative">
              <ProfileAvatar
                profilePicture={profile.profilePicture}
                alt={profile.name}
                className="h-10 w-10 md:h-14 md:w-14"
                fallback={<span className="text-xs md:text-base">{initials}</span>}
              />
              {userPresence && (
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3 md:w-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div className="w-full space-y-0.5">
              <h3 className="font-semibold text-xs leading-tight line-clamp-1 md:text-sm">
                {profile.name}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 md:text-xs">
                {profile.profession}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-1.5 px-3 pb-2 pt-0 md:px-4 md:pb-4 md:pt-0">
          <div className="flex flex-col gap-1 md:gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs md:h-8 md:text-sm"
              onClick={() => setShowDetailDialog(true)}
            >
              <Info className="mr-1 h-3 w-3 md:mr-1.5 md:h-3.5 md:w-3.5" />
              View Details
            </Button>
            {canMessage && (
              <Button
                size="sm"
                className="w-full h-7 text-xs md:h-8 md:text-sm"
                onClick={() => onMessage(profile.userId)}
              >
                <Mail className="mr-1 h-3 w-3 md:mr-1.5 md:h-3.5 md:w-3.5" />
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
          onMessage(profile.userId);
        } : undefined}
        showMessageButton={!! canMessage}
      />
    </>
  );
}
