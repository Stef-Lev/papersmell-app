import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("avatar") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.avatar = {
      data: Buffer.from(buffer),
      contentType: file.type,
    };

    await user.save();

    return NextResponse.json({ success: true, message: "Avatar uploaded successfully" });
  } catch (error) {
    console.error("POST /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user || !user.avatar?.data) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const buffer = Buffer.isBuffer(user.avatar.data)
      ? new Uint8Array(user.avatar.data)
      : new Uint8Array(Buffer.from(user.avatar.data));

    const response = new NextResponse(buffer);
    response.headers.set("Content-Type", user.avatar.contentType || "image/png");
    response.headers.set("Cache-Control", "public, max-age=3600");

    return response;
  } catch (error) {
    console.error("GET /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.avatar = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Avatar deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
