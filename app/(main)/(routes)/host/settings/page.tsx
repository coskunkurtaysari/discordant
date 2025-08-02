import { currentProfile } from "@/lib/current-profile";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HostSettingsPanel } from "@/components/admin/host-settings-panel";

const HostSettingsPage = async () => {
  const profile = await currentProfile();
  const { sessionClaims } = await auth();
  
  if (!profile) {
    return redirect("/sign-in");
  }

  // Check if user has host role (highest level)
  const userRole = (sessionClaims?.metadata as any)?.role;
  const isHost = userRole === "host";

  // Temporary: Allow any authenticated user for testing
  // TODO: Uncomment role check for production
  // if (!isHost) {
  //   return redirect("/");
  // }
  
  return (
          <div className="bg-background dark:bg-background min-h-screen">
      <HostSettingsPanel />
    </div>
  );
};

export default HostSettingsPage; 