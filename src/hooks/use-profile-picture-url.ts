"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Resolves profilePicture value (Convex storage ID or legacy URL) to a display URL.
 */
export function useProfilePictureUrl(profilePicture: string | undefined): string | undefined {
  const isLegacyUrl = profilePicture?.startsWith("http");
  const displayUrl = useQuery(
    api.files.getDisplayUrl,
    profilePicture && !isLegacyUrl ? { storageId: profilePicture } : "skip"
  );
  if (!profilePicture) return undefined;
  if (isLegacyUrl) return profilePicture;
  return displayUrl ?? undefined;
}
