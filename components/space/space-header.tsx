'use client';

import { MobileToggle } from "@/components/mobile-toggle";
import { SocketIndicator } from "@/components/socket-indicator";

interface SpaceHeaderProps {
  spaceId: string;
  name: string;
}

const SpaceHeader = ({ spaceId, name }: SpaceHeaderProps) => {
  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 bg-header dark:bg-header z-30">
      <MobileToggle serverId={spaceId} />
      <p className="font-semibold text-md text-white">{name}</p>
      <div className="ml-auto flex items-center gap-x-2">
        <SocketIndicator />
      </div>
    </div>
  );
};

export default SpaceHeader; 