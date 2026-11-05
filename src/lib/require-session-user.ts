import "server-only";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSessionUser() {
  const user = (await auth())?.user;
  if (!user || !mongoose.Types.ObjectId.isValid(user.id)) redirect("/login");
  return user;
}
