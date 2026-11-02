"use client";

import { Home, Library, Search, ChartNoAxesCombined } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "@/components/navigation-link/navigation-link";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { cn } from "@/lib/cn";
import styles from "./bottom-navigation.module.css";
import type { BottomNavigationProps } from "./bottom-navigation.types";

export default function BottomNavigation({
  userName,
  userEmail,
}: BottomNavigationProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/library", label: t("library"), icon: Library },
    { href: "/search", label: t("searchLabel"), icon: Search },
    { href: "/analytics", label: t("analytics"), icon: ChartNoAxesCombined },
  ];

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav className={styles.nav} aria-label={t("menu")}>
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(styles.item, isActive(href) && styles.active)}
          >
            <Icon aria-hidden="true" />
          </Link>
        ))}
        <span
          className={cn(
            styles.item,
            pathname.startsWith("/profile") && styles.active,
          )}
        >
          <UserAvatar
            size="small"
            userName={userName}
            userEmail={userEmail}
          />
        </span>
      </nav>
    </>
  );
}
