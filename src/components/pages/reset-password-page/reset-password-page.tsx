"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "@/components/navigation-link/navigation-link";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import styles from "./reset-password-page.module.css";

export default function ResetPasswordPage() {
  const t = useTranslations("pages.resetPassword");
  const auth = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AuthPageShell
        title={t("title")}
        description={t("invalidLink")}
        footer={<Link href="/login">{auth("loginTitle")}</Link>}
      >
        {null}
      </AuthPageShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("success"));
        router.push("/login");
      } else {
        toast.error(data.error || t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {auth("haveAccount")} <Link href="/login">{auth("loginTitle")}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextInput
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          label={auth("password")}
        />
        <TextInput
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          label={t("confirmPassword")}
        />
        <Button type="submit" loading={loading}>
          {t("submit")}
        </Button>
      </form>
    </AuthPageShell>
  );
}
