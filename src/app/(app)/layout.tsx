import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AppHeader from "@/components/app-header/app-header";
import BottomNavigation from "@/components/app-header/bottom-navigation/bottom-navigation";
import { getTheme } from "@/lib/get-theme";
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

  return (
    <>
      <AppHeader theme={await getTheme()} />
      {children}
      <BottomNavigation
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </>
  );
}
import { Suspense } from "react";
