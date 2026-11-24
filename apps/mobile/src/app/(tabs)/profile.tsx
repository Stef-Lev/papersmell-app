import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, Trash2 } from "lucide-react-native";
import { AppButton } from "../../components/app-button";
import { LoadingState } from "../../components/loading-state";
import { Notice } from "../../components/notice";
import { Panel } from "../../components/panel";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { OptionSelector } from "../../components/option-selector";
import { LocalizedText } from "../../components/localized-text";
import { mobileApi } from "../../lib/api";
import { radius, spacing } from "../../lib/theme";
import { useAuth } from "../../providers/auth-provider";
import type { MobileProfile } from "../../lib/types";
import { usePreferences } from "../../providers/preferences-provider";
import { useThemedStyles } from "../../lib/use-themed-styles";
import type { ThemeColors } from "../../lib/theme";
import { getErrorMessage, translateMessage } from "../../lib/translation";

type AvatarSource = { uri: string };

export default function ProfileScreen() {
  const { signOut, updateUserName } = useAuth();
  const {
    colors,
    locale,
    theme,
    preferencesError,
    setLocale,
    setTheme,
  } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [avatarSource, setAvatarSource] = useState<AvatarSource | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = await mobileApi.getProfile();
      setProfile(current);
      setName(current.name);
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.loadProfile"));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  useEffect(() => {
    let active = true;
    if (!profile?.hasAvatar) {
      return () => {
        active = false;
      };
    }
    mobileApi
      .getAvatarSource(profile.avatarVersion)
      .then((source) => {
        if (active) setAvatarSource(source);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(getErrorMessage(cause, locale, "mobile.errors.loadProfilePhoto"));
        }
      });
    return () => {
      active = false;
    };
  }, [locale, profile?.avatarVersion, profile?.hasAvatar]);

  async function saveName() {
    if (!name.trim() || busy) return;
    setBusy("name");
    setError("");
    setNotice("");
    try {
      const updated = await mobileApi.updateProfile({ name: name.trim() });
      await updateUserName(updated.name);
      setProfile(updated);
      setName(updated.name);
      setNotice(translateMessage("mobile.profile.profileUpdated", locale));
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.updateProfile"));
    } finally {
      setBusy("");
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || busy) return;
    if (newPassword !== confirmPassword) {
      setError(translateMessage("mobile.errors.newPasswordsMismatch", locale));
      return;
    }
    if (newPassword.length < 8) {
      setError(translateMessage("mobile.errors.newPasswordMinLength", locale));
      return;
    }
    setBusy("password");
    setError("");
    setNotice("");
    try {
      await mobileApi.updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(translateMessage("mobile.profile.passwordChanged", locale));
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.changePassword"));
    } finally {
      setBusy("");
    }
  }

  async function chooseAvatar() {
    setError("");
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.openPhotoLibrary"));
      return;
    }
    if (result.canceled) return;
    const image = result.assets[0];
    if (!image) return;
    setBusy("avatar");
    try {
      const uploaded = await mobileApi.uploadAvatar(
        image.uri,
        image.fileName ?? "profile.jpg",
        image.mimeType ?? "image/jpeg",
      );
      setProfile((current) =>
        current
          ? { ...current, hasAvatar: true, avatarVersion: uploaded.avatarVersion }
          : current,
      );
      setNotice(translateMessage("mobile.profile.photoUpdated", locale));
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.uploadProfilePhoto"));
    } finally {
      setBusy("");
    }
  }

  async function removeAvatar() {
    setBusy("avatar");
    setError("");
    try {
      await mobileApi.deleteAvatar();
      setProfile((current) =>
        current
          ? { ...current, hasAvatar: false, avatarVersion: "" }
          : current,
      );
      setNotice(translateMessage("mobile.profile.photoRemoved", locale));
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.removeProfilePhoto"));
    } finally {
      setBusy("");
    }
  }

  if (loading) return <LoadingState />;
  return (
    <Screen
      bottomNavigation
      titleKey="mobile.profile.title"
      subtitleKey="mobile.profile.subtitle"
    >
      {error ? <Notice message={error} /> : null}
      {preferencesError ? <Notice message={preferencesError} /> : null}
      {notice ? <Notice message={notice} variant="success" /> : null}
      {profile ? (
        <>
          <Panel style={styles.profilePanel}>
            <LocalizedText
              messageKey="mobile.profile.avatarSection"
              style={styles.avatarSectionTitle}
            />
            <View style={styles.avatarContent}>
              {profile.hasAvatar && avatarSource ? (
                <Image
                  alt={translateMessage("mobile.profile.profilePhoto", locale)}
                  onError={() => {
                    setAvatarSource(null);
                    setError(
                      translateMessage("mobile.errors.loadProfilePhoto", locale),
                    );
                  }}
                  resizeMode="cover"
                  source={avatarSource}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarActions}>
                <AppButton
                  icon={<Camera color={colors.secondaryContrast} size={18} />}
                  label="mobile.profile.uploadPhoto"
                  loading={busy === "avatar"}
                  onPress={() => void chooseAvatar()}
                  style={styles.avatarAction}
                  variant="secondary"
                />
                {profile.hasAvatar ? (
                  <AppButton
                    disabled={Boolean(busy)}
                    icon={<Trash2 color={colors.danger} size={18} />}
                    label="mobile.profile.removePhoto"
                    onPress={() => void removeAvatar()}
                    style={styles.avatarAction}
                    variant="destructive"
                  />
                ) : null}
              </View>
              <LocalizedText
                messageKey="mobile.profile.avatarHint"
                style={styles.avatarHint}
              />
            </View>
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText messageKey="mobile.profile.preferences" style={styles.heading} />
            <OptionSelector
              labelKey="mobile.profile.language"
              multiple={false}
              onChange={(values) => {
                const value = values[0];
                if (value === "en" || value === "el") {
                  setError("");
                  void setLocale(value).catch((cause: unknown) => {
                    setError(getErrorMessage(cause, locale, "mobile.errors.saveLanguage"));
                  });
                }
              }}
              options={[
                { value: "en", messageKey: "mobile.profile.english" },
                { value: "el", messageKey: "mobile.profile.greek" },
              ]}
              selected={[locale]}
            />
            <OptionSelector
              labelKey="mobile.profile.appearance"
              multiple={false}
              onChange={(values) => {
                const value = values[0];
                if (value === "system" || value === "light" || value === "dark") {
                  setError("");
                  void setTheme(value).catch((cause: unknown) => {
                    setError(getErrorMessage(cause, locale, "mobile.errors.saveAppearance"));
                  });
                }
              }}
              options={[
                { value: "system", messageKey: "mobile.profile.system" },
                { value: "light", messageKey: "mobile.profile.light" },
                { value: "dark", messageKey: "mobile.profile.dark" },
              ]}
              selected={[theme]}
            />
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText messageKey="mobile.profile.accountDetails" style={styles.heading} />
            <TextField
              label="mobile.profile.name"
              maxLength={100}
              onChangeText={setName}
              value={name}
            />
            <View style={styles.emailField}>
              <LocalizedText
                messageKey="mobile.profile.email"
                style={styles.emailLabel}
              />
              <Text style={styles.email}>{profile.email}</Text>
              <LocalizedText
                messageKey="mobile.profile.emailCannotChange"
                style={styles.emailHint}
              />
            </View>
            <AppButton
              disabled={!name.trim() || name.trim() === profile.name}
              label="mobile.profile.saveName"
              loading={busy === "name"}
              onPress={() => void saveName()}
            />
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText messageKey="mobile.profile.changePassword" style={styles.heading} />
            <TextField
              label="mobile.profile.currentPassword"
              onChangeText={setCurrentPassword}
              secureTextEntry
              value={currentPassword}
            />
            <TextField
              label="mobile.profile.newPassword"
              onChangeText={setNewPassword}
              secureTextEntry
              value={newPassword}
            />
            <TextField
              label="mobile.profile.confirmNewPassword"
              onChangeText={setConfirmPassword}
              secureTextEntry
              value={confirmPassword}
            />
            <AppButton
              disabled={!currentPassword || !newPassword || !confirmPassword}
              label="mobile.profile.updatePassword"
              loading={busy === "password"}
              onPress={() => void changePassword()}
              variant="outline"
            />
            <AppButton
              label="mobile.profile.forgotPassword"
              onPress={() => router.push("/(auth)/forgot-password")}
              variant="outline"
            />
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText messageKey="mobile.profile.yourLibrary" style={styles.heading} />
            <AppButton
              label="mobile.profile.manageCollections"
              onPress={() => router.push("/collections")}
              variant="outline"
            />
          </Panel>
          <AppButton
            label="mobile.common.signOut"
            onPress={() => void signOut()}
            variant="destructive"
          />
        </>
      ) : (
        <AppButton
          label="mobile.common.tryAgain"
          onPress={() => void loadProfile()}
          variant="outline"
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  profilePanel: { gap: spacing.md },
  avatarContent: {
    alignItems: "center",
    gap: spacing.md,
  },
  avatarSectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  avatarActions: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  avatarAction: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  avatarHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
  emailField: { gap: spacing.sm },
  emailLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  email: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  emailHint: { color: colors.muted, fontSize: 13 },
  avatar: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  avatarInitial: { color: colors.primary, fontSize: 40, fontWeight: "800" },
  form: { gap: spacing.md },
  heading: { color: colors.text, fontSize: 17, fontWeight: "800" },
});
