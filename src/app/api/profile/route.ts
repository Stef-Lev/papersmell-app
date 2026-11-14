import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      hasAvatar: !!user.avatar?.data,
      avatarVersion: user.avatarVersion ?? "",
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update name if provided
    if (body.name && typeof body.name === "string") {
      user.name = body.name.trim();
    }

    // Update password if provided
    if (body.currentPassword && body.newPassword) {
      if (!(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      user.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    await user.save();

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      hasAvatar: !!user.avatar?.data,
      avatarVersion: user.avatarVersion ?? "",
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
