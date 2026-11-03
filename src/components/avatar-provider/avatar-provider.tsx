"use client";

import { createContext, useContext, useState } from "react";

type AvatarContextType = {
  avatarUrl: string | null;
  refreshAvatar: (version: string) => void;
  clearAvatar: () => void;
};

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({
  children,
  initialAvatarUrl = null,
}: {
  children: React.ReactNode;
  initialAvatarUrl?: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const refreshAvatar = (version: string) => {
    setAvatarUrl(`/api/profile/avatar?v=${encodeURIComponent(version)}`);
  };
  const clearAvatar = () => setAvatarUrl(null);

  return (
    <AvatarContext.Provider value={{ avatarUrl, refreshAvatar, clearAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error("useAvatar must be used within AvatarProvider");
  }
  return context;
}
