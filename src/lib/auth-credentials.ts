import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { isTestLogin, TEST_USER } from "@/lib/test-user";
import User from "@/models/User";

export async function authenticateCredentials(
  emailInput: unknown,
  passwordInput: unknown,
) {
  const email = String(emailInput ?? "").toLowerCase().trim();
  const password = String(passwordInput ?? "");
  if (!email || !password) return null;

  if (isTestLogin(email, password)) return TEST_USER;

  await connectDB();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;

  return { id: user._id.toString(), name: user.name, email: user.email };
}
