"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, 
  MapPin, 
  Info
} from "lucide-react";
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
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profilePicture} alt={profile.name} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              {userPresence && (
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div className="w-full space-y-1">
              <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                {profile.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                {profile.profession}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Location/Country */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-1">
              {profile.country}
            </span>
          </div>

          {/* Action buttons - stacked vertically */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowDetailDialog(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              View Details
            </Button>
            {canMessage && (
              <Button
                size="sm"
                className="w-full"
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
          onMessage(profile.userId);
        } : undefined}
        showMessageButton={!! canMessage}
      />
    </>
  );
}
