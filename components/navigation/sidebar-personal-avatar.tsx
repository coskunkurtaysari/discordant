"use client";

import { useRouter } from "next/navigation";
import { ActionTooltip } from "@/components/action-tooltip";

interface SidebarPersonalAvatarProps {
  profile: any;
}

export const SidebarPersonalAvatar = ({ profile }: SidebarPersonalAvatarProps) => {
  const router = useRouter();

  const handleAvatarClick = () => {
    router.push('/personal-studio');
  };

  return (
    <ActionTooltip
      side="right"
      align="center"
      label="Personal Studio"
    >
      <div className="group relative flex items-center">
        <button
          onClick={handleAvatarClick}
          className="group relative flex items-center justify-center rounded-[24px] overflow-hidden w-[48px] h-[48px] mx-3 transition-all hover:rounded-[16px] z-50 bg-red-600 hover:bg-red-500"
        >
          <span className="text-white font-semibold text-lg">
            {profile?.name?.charAt(0)?.toUpperCase() || 'P'}
          </span>
        </button>
      </div>
    </ActionTooltip>
  );
}; 