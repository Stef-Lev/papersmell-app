import { Metadata } from "next";
import { isAdminSession } from "@/lib/admin";
import { getTheme } from "@/lib/get-theme";
import ProfilePage from "@/components/pages/profile-page/profile-page";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile, avatar, and account settings",
};

export default async function Page() {
  return <ProfilePage theme={await getTheme()} isAdmin={await isAdminSession()} />;
}
