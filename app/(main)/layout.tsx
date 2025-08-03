// /app/(main)/layout.tsx

import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { PersonalStudioSidebar } from "@/components/navigation/personal-studio-sidebar";
import { currentProfile } from "@/lib/current-profile";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const profile = await currentProfile();

  return (
    <>
      <div className="h-full">
        <div className="h-full flex w-[72px] z-30 flex-col fixed inset-y-0">
          <NavigationSidebar />
        </div>
        <main className="h-full w-full pl-[72px]">{children}</main>
      </div>
    </>
  );
};

export default MainLayout;
