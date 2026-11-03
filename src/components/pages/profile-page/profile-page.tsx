"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { Camera, Trash2, Eye, EyeOff, LogOut } from "lucide-react";
import Link from "@/components/navigation-link/navigation-link";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import RouteLoading from "@/components/route-loading/route-loading";
import { useAvatar } from "@/components/avatar-provider/avatar-provider";
import PreferencesSection from "./preferences-section/preferences-section";
import { Theme } from "@/lib/preferences";
import styles from "./profile-page.module.css";

interface ProfilePageProps {
  isAdmin?: boolean;
  theme?: Theme;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  hasAvatar: boolean;
}

export default function ProfilePage({
  theme = Theme.System,
  isAdmin = false,
}: ProfilePageProps) {
  const t = useTranslations("pages.profile");
  const tAdmin = useTranslations("biblionetCopy");
  const { data: session, update: updateSession } = useSession();
  const { avatarUrl, refreshAvatar, clearAvatar } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (!active) return;
          setProfile(data);
          setName(data.name);
        } else {
          toast.error(t("errorFetchingProfile"));
        }
      } catch {
        if (active) {
          toast.error(t("errorFetchingProfile"));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, [t]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("errorInvalidImageType"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("errorFileTooLarge"));
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as { avatarVersion: string };
        if (profile) {
          setProfile({ ...profile, hasAvatar: true });
        }
        refreshAvatar(data.avatarVersion);
        toast.success(t("successAvatarUploaded"));
      } else {
        const data = await res.json();
        toast.error(data.error || t("errorUploadingAvatar"));
      }
    } catch {
      toast.error(t("errorUploadingAvatar"));
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm(t("confirmRemoveAvatar"))) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      if (res.ok) {
        clearAvatar();
        if (profile) {
          setProfile({ ...profile, hasAvatar: false });
        }
        toast.success(t("successAvatarRemoved"));
      } else {
        toast.error(t("errorRemovingAvatar"));
      }
    } catch {
      toast.error(t("errorRemovingAvatar"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("errorNameRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        await updateSession({ user: { ...session?.user, name: data.name } });
        toast.success(t("successProfileUpdated"));
      } else {
        const data = await res.json();
        toast.error(data.error || t("errorUpdatingProfile"));
      }
    } catch {
      toast.error(t("errorUpdatingProfile"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("errorAllFieldsRequired"));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t("errorPasswordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("errorPasswordsNotMatching"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        toast.success(t("successPasswordChanged"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      } else {
        const data = await res.json();
        toast.error(data.error || t("errorChangingPassword"));
      }
    } catch {
      toast.error(t("errorChangingPassword"));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <RouteLoading />;
  }

  if (!profile) {
    return <div className={styles.error}>{t("errorLoadingProfile")}</div>;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>{t("title")}</h1>

        {/* Avatar Section */}
        <section className={styles.section}>
          <h2>{t("avatarSection")}</h2>
          <div className={styles.avatarContainer}>
            {avatarUrl ? (
              // Avatar URLs are served directly by the authenticated route.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={profile.name} className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>{profile.name.charAt(0).toUpperCase()}</div>
            )}
            <div className={styles.avatarActions}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                variant="secondary"
              >
                <Camera size={18} />
                {t("uploadAvatar")}
              </Button>
              {profile.hasAvatar && (
                <Button
                  onClick={handleRemoveAvatar}
                  disabled={isSaving}
                  variant="destructive"
                >
                  <Trash2 size={18} />
                  {t("removeAvatar")}
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={isSaving}
              style={{ display: "none" }}
            />
            <p className={styles.hint}>{t("avatarHint")}</p>
          </div>
        </section>

        <PreferencesSection theme={theme} />

        {isAdmin && (
          <section className={styles.section}>
            <Link href="/copy-to-my-database" className={styles.adminLink}>
              {tAdmin("title")}
            </Link>
          </section>
        )}

        {/* Profile Information Section */}
        <section className={styles.section}>
          <h2>{t("profileSection")}</h2>
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.formGroup}>
              <TextInput
                label={t("name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <TextInput
                label={t("email")}
                value={profile.email}
                disabled
                type="email"
              />
              <p className={styles.hint}>{t("emailCannotChange")}</p>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("saving") : t("saveChanges")}
            </Button>
          </form>
        </section>

        {/* Password Section */}
        <section className={styles.section}>
          <h2>{t("passwordSection")}</h2>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)} variant="secondary">
              {t("changePassword")}
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className={styles.form}>
              <div className={styles.formGroup}>
                <div className={styles.passwordInputWrapper}>
                  <TextInput
                    label={t("currentPassword")}
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={styles.showPasswordButton}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.passwordInputWrapper}>
                  <TextInput
                    label={t("newPassword")}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={styles.showPasswordButton}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.passwordInputWrapper}>
                  <TextInput
                    label={t("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.showPasswordButton}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("saving") : t("changePassword")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isSaving}
                  variant="secondary"
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Logout Section */}
        <section className={styles.section}>
          <h2>{t("logoutSection")}</h2>
          <p>{t("logoutDescription")}</p>
          <Button
            onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
            variant="destructive"
          >
            <LogOut size={18} />
            {t("logout")}
          </Button>
        </section>
      </div>
    </main>
  );
}
