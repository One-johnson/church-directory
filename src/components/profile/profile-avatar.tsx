"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfilePictureUrl } from "@/hooks/use-profile-picture-url";

interface ProfileAvatarProps {
  profilePicture?: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Renders an avatar for a profile picture (supports Convex storage ID or legacy URL).
 */
export function ProfileAvatar({
  profilePicture,
  alt = "Profile",
  className,
  fallback,
}: ProfileAvatarProps): React.JSX.Element {
  const src = useProfilePictureUrl(profilePicture);
  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
