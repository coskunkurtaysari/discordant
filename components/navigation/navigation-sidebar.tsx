// src/components/navigation/navigation-sidebar.tsx
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { NavigationAction } from "@/components/navigation/navigation-action";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { NavigationMenu } from "@/components/navigation/navigation-menu";
import { SidebarPersonalAvatar } from "./sidebar-personal-avatar";

export const NavigationSidebar = async () => {
  const profile = await currentProfile();
  if (!profile) {
    return redirect("/");
  }

  const servers = await db.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });
  
  return (
    <div className="space-y-4 flex flex-col items-center h-full text-white w-full bg-sidebar dark:bg-sidebar py-3">
      {/* Personal Studio Avatar at Top */}
      <div className="flex flex-col items-center space-y-2">
        <SignedIn>
          <SidebarPersonalAvatar profile={profile} />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </div>

      {/* Separator Line */}
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />

      {/* Server List in Middle */}
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
          <div key={server.id} className="mb-4">
            <NavigationItem
              id={server.id}
              name={server.name}
              imageUrl={server.imageUrl || ""}
            />
          </div>
        ))}
      </ScrollArea>

      {/* Add Server and Explore at Bottom */}
      <div className="flex pb-3 mt-auto items-center flex-col gap-y-4">
        <NavigationAction />
        <NavigationMenu />
        
        {/* User Profile at Bottom */}
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-[45px] w-[45px]",
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </div>
    </div>
  );
};
