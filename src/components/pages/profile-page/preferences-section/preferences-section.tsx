"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Dropdown from "@/components/dropdown/dropdown";
import {
  LOCALE_COOKIE,
  LOCALE_LABELS,
  Locale,
  isLocale,
} from "@/i18n/config";
import { COOKIE_MAX_AGE, THEME_COOKIE, Theme, isTheme } from "@/lib/preferences";
import styles from "../profile-page.module.css";
import type { PreferencesSectionProps } from "./preferences-section.types";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export default function PreferencesSection({ theme }: PreferencesSectionProps) {
  const t = useTranslations("preferences");
  const locale = useLocale();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isPending, startTransition] = useTransition();

  function changeLocale(value: string) {
    if (!isLocale(value)) return;
    setCookie(LOCALE_COOKIE, value);
    document.documentElement.lang = value;
    startTransition(() => router.refresh());
  }

  function changeTheme(value: string) {
    if (!isTheme(value)) return;
    setCookie(THEME_COOKIE, value);
    setCurrentTheme(value);
    if (value === Theme.System) {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = value;
    }
    startTransition(() => router.refresh());
  }

  return (
    <section className={styles.section}>
      <h2>{t("title")}</h2>
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <Dropdown
            label={t("language")}
            value={locale}
            onValueChange={changeLocale}
            disabled={isPending}
            options={Object.values(Locale).map((value) => ({
              value,
              label: LOCALE_LABELS[value],
            }))}
          />
        </div>
        <div className={styles.formGroup}>
          <Dropdown
            label={t("theme")}
            value={currentTheme}
            onValueChange={changeTheme}
            disabled={isPending}
            options={[
              { value: Theme.System, label: t("system") },
              { value: Theme.Light, label: t("light") },
              { value: Theme.Dark, label: t("dark") },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
