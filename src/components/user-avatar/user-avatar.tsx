"use client";

import Image from "next/image";
import Link from "@/components/navigation-link/navigation-link";
import { useAvatar } from "@/components/avatar-provider/avatar-provider";
import styles from "./user-avatar.module.css";
import type { UserAvatarProps } from "./user-avatar.types";

export default function UserAvatar({
  size = "medium",
  as = "link",
  href = "/profile",
  onClick,
  children,
  userName,
  userEmail,
}: UserAvatarProps) {
  const { avatarUrl } = useAvatar();

  const displayName = userName || userEmail;

  const initials =
    displayName
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  const avatarContent = (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      title={displayName || "User"}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName || "User avatar"}
          className={styles.image}
          width={48}
          height={48}
          loading="eager"
          unoptimized
        />
      ) : (
        <div className={styles.initials}>{initials}</div>
      )}
      {children}
    </div>
  );

  if (as === "button") {
    return (
      <button onClick={onClick} className={styles.button}>
        {avatarContent}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick}>
      {avatarContent}
    </Link>
  );
}
