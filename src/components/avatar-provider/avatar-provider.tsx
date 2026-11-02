"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type AvatarContextType = {
  avatarUrl: string | null;
  isLoading: boolean;
  refreshAvatar: () => Promise<void>;
};

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAvatarData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/avatar", { cache: "no-store" });
      const url = res.ok ? URL.createObjectURL(await res.blob()) : null;
      setAvatarUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    if (session?.user?.id && !hasFetched) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAvatarData();
    }
  }, [session?.user?.id, hasFetched]);

  const refreshAvatar = fetchAvatarData;

  return (
    <AvatarContext.Provider value={{ avatarUrl, isLoading, refreshAvatar }}>
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
