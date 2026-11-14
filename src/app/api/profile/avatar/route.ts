import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUserId } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function getFormDataValue(formData: object, key: string): unknown {
  const getter: unknown = Reflect.get(formData, "get");
  return typeof getter === "function"
    ? Reflect.apply(getter, formData, [key])
    : null;
}

function isUploadedFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    "size" in value &&
    typeof value.size === "number" &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function"
  );
}

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const avatarValue = getFormDataValue(formData, "avatar");
    if (!isUploadedFile(avatarValue)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const file = avatarValue;

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
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.avatar = {
      data: Buffer.from(buffer),
      contentType: file.type,
    };
    user.avatarVersion = randomUUID();

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarVersion: user.avatarVersion,
    });
  } catch (error) {
    console.error("POST /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user || !user.avatar?.data) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const buffer = Buffer.isBuffer(user.avatar.data)
      ? new Uint8Array(user.avatar.data)
      : new Uint8Array(Buffer.from(user.avatar.data));

    const response = new NextResponse(buffer);
    response.headers.set("Content-Type", user.avatar.contentType || "image/png");
    response.headers.set("Cache-Control", "private, max-age=31536000, immutable");

    return response;
  } catch (error) {
    console.error("GET /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.avatar = undefined;
    user.avatarVersion = randomUUID();
    await user.save();

    return NextResponse.json({ success: true, message: "Avatar deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
