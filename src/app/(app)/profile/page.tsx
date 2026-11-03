import { Suspense } from "react";
import { Metadata } from "next";
import { isAdminSession } from "@/lib/admin";
import { getTheme } from "@/lib/get-theme";
import ProfilePage from "@/components/pages/profile-page/profile-page";
import RouteLoading from "@/components/route-loading/route-loading";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile, avatar, and account settings",
};

export default function Page() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ProfilePageContent />
    </Suspense>
  );
}

async function ProfilePageContent() {
  return <ProfilePage theme={await getTheme()} isAdmin={await isAdminSession()} />;
}
