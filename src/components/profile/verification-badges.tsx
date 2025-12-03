"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail, Phone, Shield, CheckCircle2 } from "lucide-react";

interface VerificationBadgesProps {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  pastorEndorsed?: boolean;
  backgroundCheck?: boolean;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

export function VerificationBadges({
  emailVerified,
  phoneVerified,
  pastorEndorsed,
  backgroundCheck,
  size = "md",
  showLabels = false,
}: VerificationBadgesProps) {
  const badges = [
    {
      icon: Mail,
      label: "Email Verified",
      verified: emailVerified,
      color: "text-blue-600",
    },
    {
      icon: Phone,
      label: "Phone Verified",
      verified: phoneVerified,
      color: "text-green-600",
    },
    {
      icon: Shield,
      label: "Pastor Endorsed",
      verified: pastorEndorsed,
      color: "text-purple-600",
    },
    {
      icon: CheckCircle2,
      label: "Background Check",
      verified: backgroundCheck,
      color: "text-amber-600",
    },
  ];

  const verifiedBadges = badges.filter((b) => b.verified);

  if (verifiedBadges.length === 0) {
    return null;
  }

  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  if (showLabels) {
    return (
      <div className="flex flex-wrap gap-2">
        {verifiedBadges.map((badge) => (
          <Badge key={badge.label} variant="secondary" className="gap-1">
            <badge.icon className={`${iconSize} ${badge.color}`} />
            {badge.label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {verifiedBadges.map((badge) => (
          <Tooltip key={badge.label}>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <badge.icon className={`${iconSize} ${badge.color}`} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{badge.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
