import { authenticateCredentials } from "@/lib/auth-credentials";
import { createMobileAccessToken, MOBILE_TOKEN_TTL_SECONDS } from "@/lib/mobile-token";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.toLowerCase().trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) {
    return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const user = await authenticateCredentials(email, password);
  if (!user) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createMobileAccessToken(user);
  return Response.json({
    token,
    expiresAt: Date.now() + MOBILE_TOKEN_TTL_SECONDS * 1000,
    user: { name: user.name, email: user.email },
  });
}
