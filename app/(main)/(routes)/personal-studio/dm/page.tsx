import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { PersonalStudioContent } from "@/components/navigation/personal-studio-content";

const DirectMessagesPage = async () => {
  const profile = await currentProfile();
  
  if (!profile) {
    return redirect("/");
  }

  return (
    <PersonalStudioContent 
      section="dm"
      profile={profile}
    />
  );
};

export default DirectMessagesPage; 