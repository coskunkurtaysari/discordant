import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { PersonalStudioContent } from "@/components/navigation/personal-studio-content";

const FriendsPage = async () => {
  const profile = await currentProfile();
  
  if (!profile) {
    return redirect("/");
  }

  return (
    <PersonalStudioContent 
      section="friends"
      profile={profile}
    />
  );
};

export default FriendsPage; 