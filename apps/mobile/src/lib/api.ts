import { clearStoredSession, readStoredSession } from "./auth-storage";
import type {
  BookEntry,
  BookCollection,
  CatalogBook,
  LibraryResponse,
  MobileProfile,
  MobileSession,
  Shelf,
} from "./types";
import { MobileMessageError } from "./translation";

type LoginResponse = MobileSession;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let unauthorizedHandler: (() => void | Promise<void>) | undefined;

export function setUnauthorizedHandler(handler?: () => void | Promise<void>) {
  unauthorizedHandler = handler;
}

function getApiBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new MobileMessageError("mobile.errors.apiUrl");
  }
  return baseUrl;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const session = authenticated ? await readStoredSession() : null;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new MobileMessageError("mobile.errors.invalidServerResponse");
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && session) {
      await clearStoredSession();
      await unauthorizedHandler?.();
    }
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
      : new MobileMessageError("mobile.errors.requestFailed", {
          status: response.status,
        });
    if (message instanceof MobileMessageError) throw message;
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const mobileApi = {
  login(email: string, password: string) {
    return request<LoginResponse>(
      "/api/mobile/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
  },

  register(name: string, email: string, password: string) {
    return request<{ ok: true }>(
      "/api/register",
      { method: "POST", body: JSON.stringify({ name, email, password }) },
      false,
    );
  },

  getLibrary() {
    return request<LibraryResponse>("/api/library");
  },

  searchBooks(query: string) {
    return request<{ results: CatalogBook[] }>(
      `/api/books/search?q=${encodeURIComponent(query)}`,
    );
  },

  addBook(book: CatalogBook, status: Shelf, collectionIds: string[] = []) {
    return request<{ id: string }>("/api/library", {
      method: "POST",
      body: JSON.stringify({ book, status, collectionIds }),
    });
  },

  getCollections() {
    return request<{ collections: BookCollection[] }>("/api/collections");
  },

  createCollection(name: string) {
    return request<{ collection: BookCollection }>("/api/collections", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  renameCollection(id: string, name: string) {
    return request<{ collection: BookCollection }>(
      `/api/collections/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify({ name }) },
    );
  },

  deleteCollection(id: string) {
    return request<{ success: true }>(
      `/api/collections/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  getProfile() {
    return request<MobileProfile>("/api/profile");
  },

  updateProfile(updates: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    return request<MobileProfile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async uploadAvatar(uri: string, fileName: string, mimeType: string) {
    const imageResponse = await fetch(uri);
    if (!imageResponse.ok) {
      throw new MobileMessageError("mobile.errors.readSelectedImage");
    }
    const image = await imageResponse.blob();
    const formData = new FormData();
    formData.append(
      "avatar",
      new Blob([image], { type: mimeType }),
      fileName,
    );
    return request<{ success: true; avatarVersion: string }>(
      "/api/profile/avatar",
      { method: "POST", body: formData },
    );
  },

  deleteAvatar() {
    return request<{ success: true }>("/api/profile/avatar", {
      method: "DELETE",
    });
  },

  async getAvatarSource(version: string) {
    const session = await readStoredSession();
    if (!session?.token) {
      throw new MobileMessageError("mobile.errors.signInExpired");
    }

    const response = await fetch(
      `${getApiBaseUrl()}/api/profile/avatar?v=${encodeURIComponent(version)}`,
      {
        headers: {
          Accept: "image/*",
          Authorization: `Bearer ${session.token}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        await clearStoredSession();
        await unauthorizedHandler?.();
      }
      throw new ApiError(
        `Profile photo request failed (${response.status}).`,
        response.status,
      );
    }

    const contentType = response.headers
      .get("content-type")
      ?.split(";")[0]
      .trim();
    if (!contentType?.startsWith("image/")) {
      throw new ApiError(
        "Profile photo endpoint returned a non-image response.",
        response.status,
      );
    }

    const image = await response.blob();
    const uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Profile photo could not be decoded."));
        }
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Profile photo could not be decoded."));
      };
      reader.readAsDataURL(image);
    });

    return { uri };
  },

  requestPasswordReset(email: string) {
    return request<{ message: string }>(
      "/api/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      false,
    );
  },

  resetPassword(token: string, password: string) {
    return request<{ message: string }>(
      "/api/auth/reset-password",
      { method: "POST", body: JSON.stringify({ token, password }) },
      false,
    );
  },

  updateBook(
    id: string,
    updates: Partial<
      Pick<
        BookEntry,
        | "status"
        | "currentPage"
        | "rating"
        | "review"
        | "startedAt"
        | "finishedAt"
        | "collectionIds"
      >
    > & {
      bookOverrides?: Partial<
        Pick<CatalogBook, "title" | "authors" | "isbn" | "pageCount" | "coverUrl">
      >;
    },
  ) {
    return request<{ success: true }>(`/api/library/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  removeBook(id: string) {
    return request<{ success: true }>(`/api/library/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
