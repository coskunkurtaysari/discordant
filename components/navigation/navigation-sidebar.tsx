"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { NavigationAction } from "@/components/navigation/navigation-action";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { NavigationMenu } from "@/components/navigation/navigation-menu";
import { SidebarPersonalAvatar } from "./sidebar-personal-avatar";

export const NavigationSidebar = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
          
          // Servers'ı da fetch et
          const serversResponse = await fetch('/api/servers');
          if (serversResponse.ok) {
            const serversData = await serversResponse.json();
            setServers(serversData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-4 flex flex-col items-center h-full text-white w-full bg-sidebar dark:bg-sidebar py-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="space-y-4 flex flex-col items-center h-full text-white w-full bg-sidebar dark:bg-sidebar py-3">
        <SignInButton />
      </div>
    );
  }
  
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
