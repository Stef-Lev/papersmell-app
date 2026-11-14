import "server-only";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { readMobileAccessToken } from "@/lib/mobile-token";
import Collection from "@/models/Collection";

/** The signed-in user's id, or null when there is no valid session. */
export async function getSessionUserId() {
  const session = await auth();
  const sessionId = session?.user?.id;
  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    return new mongoose.Types.ObjectId(sessionId);
  }

  const authorization = (await headers()).get("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;

  let tokenUser: Awaited<ReturnType<typeof readMobileAccessToken>>;
  try {
    tokenUser = await readMobileAccessToken(match[1]);
  } catch {
    return null;
  }
  const id = tokenUser?.id;
  return id && mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : null;
}

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export function unauthorized() {
  return jsonError("Authentication required.", 401);
}

export function isDuplicateKeyError(error: unknown) {
  return (
    error instanceof mongoose.mongo.MongoServerError && error.code === 11000
  );
}

export function isObjectIdList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
      (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id),
    ) &&
    new Set(value).size === value.length
  );
}

/** True when every id refers to a collection owned by the user. */
export async function ownsCollections(
  ids: string[],
  userId: mongoose.Types.ObjectId,
) {
  if (!ids.length) return true;
  const owned = await Collection.countDocuments({ _id: { $in: ids }, userId });
  return owned === ids.length;
}

export function toCollectionJson(collection: {
  _id: mongoose.Types.ObjectId;
  name: string;
}) {
  return { id: collection._id.toString(), name: collection.name };
}

/** The trimmed collection name from a request body, or null if invalid. */
export function readCollectionName(body: unknown) {
  const name =
    body &&
    typeof body === "object" &&
    "name" in body &&
    typeof body.name === "string"
      ? body.name.trim()
      : "";
  return name && name.length <= 50 ? name : null;
}
