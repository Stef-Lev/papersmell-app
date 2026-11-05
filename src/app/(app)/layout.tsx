import { connection } from "next/server";
import { AvatarProvider } from "@/components/avatar-provider/avatar-provider";
import AppHeader from "@/components/app-header/app-header";
import BottomNavigation from "@/components/app-header/bottom-navigation/bottom-navigation";
import { getTheme } from "@/lib/get-theme";
import { connectDB } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/require-session-user";
import User from "@/models/User";
import RouteLoading from "@/components/route-loading/route-loading";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}

async function AuthenticatedLayout({ children }: Pick<LayoutProps<"/">, "children">) {
  await connection();
  const sessionUser = await requireSessionUser();

  let initialAvatarUrl: string | null = null;
  await connectDB();
  const user = await User.findById(sessionUser.id)
    .select("avatar.contentType avatarVersion")
    .lean();
  if (user?.avatar?.contentType) {
    const version = user.avatarVersion || sessionUser.id;
    initialAvatarUrl = `/api/profile/avatar?v=${encodeURIComponent(version)}`;
  }

  return (
    <AvatarProvider initialAvatarUrl={initialAvatarUrl}>
      <AppHeader theme={await getTheme()} />
      {children}
      <BottomNavigation
        userName={sessionUser.name}
        userEmail={sessionUser.email}
      />
    </AvatarProvider>
  );
}
import { Suspense } from "react";
