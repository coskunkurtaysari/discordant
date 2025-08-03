"use client";

import { ActionTooltip } from "@/components/action-tooltip";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PersonalStudioButtonProps {
  profile: any;
}

export const PersonalStudioButton = ({ profile }: PersonalStudioButtonProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <ActionTooltip
      side="right"
      align="center"
      label="Personal Studio"
    >
      <div className="group relative flex items-center">
        <button
          className="group relative flex items-center justify-center rounded-[24px] overflow-hidden w-[48px] h-[48px] mx-3 transition-all hover:rounded-[16px] z-50 bg-orange-600 hover:bg-orange-500"
        >
          {profile.imageUrl && !imageError ? (
            <Image
              fill
              src={profile.imageUrl}
              alt="Personal Studio"
              sizes="48px"
              onError={handleImageError}
            />
          ) : null}
          <span className={cn(
            "text-white font-semibold text-lg",
            profile.imageUrl && !imageError ? "hidden" : ""
          )}>
            {profile.name?.charAt(0)?.toUpperCase() || 'P'}
          </span>
        </button>
      </div>
    </ActionTooltip>
  );
}; 