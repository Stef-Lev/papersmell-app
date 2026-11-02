import "server-only";
import { auth } from "@/auth";

/** True when the signed-in user's email is listed in ADMIN_EMAILS (comma separated). */
export async function isAdminSession() {
  const email = (await auth())?.user?.email?.toLowerCase().trim();
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .some((admin) => admin.toLowerCase().trim() === email);
}
