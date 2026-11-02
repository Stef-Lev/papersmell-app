import Link from "@/components/navigation-link/navigation-link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import UserAvatar from "@/components/user-avatar/user-avatar";
import PreferencesSwitcher from "@/components/preferences-switcher/preferences-switcher";
import styles from "./app-header.module.css";
import type { AppHeaderProps } from "./app-header.types";

export default async function AppHeader({ theme }: AppHeaderProps) {
  const t = await getTranslations("nav");
  const session = await auth();

  const links = [
    { href: "/library", label: t("library") },
    { href: "/search", label: t("searchLabel") },
    { href: "/analytics", label: t("analytics") },
  ];

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="PaperSmell">
        <Image
          src="/papersmell-logo.svg"
          alt=""
          width={56}
          height={56}
          className={styles.logoMark}
        />
        <span className={styles.logoText}>PaperSmell</span>
      </Link>
      <nav className={styles.nav}>
        {links.map(({ href, label }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.account}>
        <PreferencesSwitcher theme={theme} />
        <UserAvatar 
          size="medium"
          userName={session?.user?.name}
          userEmail={session?.user?.email}
        />
      </div>
    </header>
  );
}
