// /app/(main)/(routes)/servers/[serverId]/layout.tsx

import { ServerSidebar } from "@/components/server/server-sidebar";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ServerIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { serverId: string };
}) => {
  const { serverId } = await params;

  return (
    <div className="h-full">
      <div className="sidebar md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverId={serverId} />
      </div>
              <main className="h-full md:pl-60 bg-background dark:bg-background">
        {children}
      </main>
    </div>
  );
};

export default ServerIdLayout;
