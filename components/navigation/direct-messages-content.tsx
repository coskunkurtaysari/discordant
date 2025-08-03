"use client";

import { useState, useEffect } from "react";
import { PersonalStudioSidebar } from "./personal-studio-sidebar";
import { usePathname, useRouter } from "next/navigation";

type SectionType = "studio" | "friends" | "store" | "dm";

interface DirectMessagesContentProps {
  profile: any;
  children: React.ReactNode;
}

export const DirectMessagesContent = ({ profile, children }: DirectMessagesContentProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionType>("dm");

  // Determine active section based on pathname
  const getActiveSection = (): SectionType => {
    if (!pathname) return "dm";
    if (pathname.includes('/studio')) return "studio";
    if (pathname.includes('/friends')) return "friends";
    if (pathname.includes('/store')) return "store";
    if (pathname.includes('/dm') || pathname.includes('/direct-messages')) return "dm";
    return "dm"; // default
  };

  useEffect(() => {
    const newSection = getActiveSection();
    setActiveSection(newSection);
  }, [pathname]);

  const handleSectionChange = (newSection: SectionType) => {
    setActiveSection(newSection);
    
    // Navigate to appropriate route
    switch (newSection) {
      case "studio":
        router.push('/personal-studio/studio');
        break;
      case "friends":
        router.push('/personal-studio/friends');
        break;
      case "store":
        router.push('/personal-studio/store');
        break;
      case "dm":
        // Stay in DM area
        break;
    }
  };

  const currentSection = activeSection;

  return (
    <div className="h-full flex">
      {/* Personal Studio Sidebar */}
      <div className="sidebar md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <PersonalStudioSidebar 
          profile={profile}
          activeSection={currentSection}
          onSectionChange={handleSectionChange}
          onClose={() => router.push('/dashboard')}
        />
      </div>
      
      {/* Content Area */}
      <div className="flex-1 md:pl-60 bg-background dark:bg-background">
        {children}
      </div>
    </div>
  );
}; 