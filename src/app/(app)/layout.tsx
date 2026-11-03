import { redirect } from "next/navigation";
import { connection } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { AvatarProvider } from "@/components/avatar-provider/avatar-provider";
import AppHeader from "@/components/app-header/app-header";
import BottomNavigation from "@/components/app-header/bottom-navigation/bottom-navigation";
import { getTheme } from "@/lib/get-theme";
import { connectDB } from "@/lib/mongodb";
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
  const session = await auth();
  if (!session?.user) redirect("/login");

  let initialAvatarUrl: string | null = null;
  if (mongoose.isValidObjectId(session.user.id)) {
    await connectDB();
    const user = await User.findById(session.user.id)
      .select("avatar.contentType avatarVersion")
      .lean();
    if (user?.avatar?.contentType) {
      const version = user.avatarVersion || session.user.id;
      initialAvatarUrl = `/api/profile/avatar?v=${encodeURIComponent(version)}`;
    }
  }

  return (
    <AvatarProvider initialAvatarUrl={initialAvatarUrl}>
      <AppHeader theme={await getTheme()} />
      {children}
      <BottomNavigation
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </AvatarProvider>
  );
}
import { Suspense } from "react";
