"use client";

import { useState, useEffect } from "react";
import { FriendsSection } from "./friends-section";
import { StoreSection } from "./store-section";
import { DMSection } from "./dm-section";
import { PersonalStudioSidebar } from "./personal-studio-sidebar";
import { usePathname, useRouter } from "next/navigation";
import { StudioChannel } from "@/components/studio-channel";

type SectionType = "studio" | "friends" | "store" | "dm";

interface PersonalStudioContentProps {
  section: SectionType;
  profile: any;
}

export const PersonalStudioContent = ({ section, profile }: PersonalStudioContentProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionType>(section);

  // Determine active section based on pathname
  const getActiveSection = (): SectionType => {
    if (!pathname) return "studio";
    if (pathname.includes('/studio')) return "studio";
    if (pathname.includes('/friends')) return "friends";
    if (pathname.includes('/store')) return "store";
    if (pathname.includes('/dm')) return "dm";
    return "studio"; // default
  };

  useEffect(() => {
    const newSection = getActiveSection();
    setActiveSection(newSection);
  }, [pathname]);

  const handleSectionChange = (newSection: SectionType) => {
    setActiveSection(newSection);
    // Update URL without full navigation
    window.history.pushState({}, '', `/personal-studio/${newSection}`);
  };

  const currentSection = activeSection; // Use state instead of pathname-based detection

  return (
    <div className="h-full flex">
      {/* Personal Studio Sidebar */}
      <PersonalStudioSidebar 
        profile={profile}
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
        onClose={() => router.push('/dashboard')}
      />
      
      {/* Content Area */}
      <div className="flex-1 bg-zinc-900">
        {currentSection === "studio" && (
          <StudioChannel 
            channelId="personal-studio"
            channelName="Personal Studio"
            serverName="Personal"
          />
        )}
        {currentSection === "friends" && <FriendsSection />}
        {currentSection === "store" && <StoreSection />}
        {currentSection === "dm" && <DMSection />}
      </div>
    </div>
  );
}; 