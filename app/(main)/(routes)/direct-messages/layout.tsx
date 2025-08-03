// /app/(main)/(routes)/direct-messages/layout.tsx

import { PersonalStudioSidebar } from "@/components/navigation/personal-studio-sidebar";
import { currentProfile } from "@/lib/current-profile";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DirectMessagesContent } from "@/components/navigation/direct-messages-content";

const DirectMessagesLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const profile = await currentProfile();
  
  if (!profile) {
    const authInstance = await auth();
    return authInstance.redirectToSignIn();
  }

  return (
    <DirectMessagesContent profile={profile}>
      {children}
    </DirectMessagesContent>
  );
};

export default DirectMessagesLayout; 