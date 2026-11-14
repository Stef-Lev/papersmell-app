import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
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

type AvatarSource = { uri: string; headers: Record<string, string> };

export default function ProfileScreen() {
  const { signOut, updateUserName } = useAuth();
  const {
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
      setError(cause instanceof Error ? cause.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

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
          setError(cause instanceof Error ? cause.message : "Could not load your profile photo.");
        }
      });
    return () => {
      active = false;
    };
  }, [profile?.avatarVersion, profile?.hasAvatar]);

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
      setNotice("Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your profile.");
    } finally {
      setBusy("");
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || busy) return;
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
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
      setNotice("Password changed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change your password.");
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
      setError(cause instanceof Error ? cause.message : "Could not open the photo library.");
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
      setNotice("Profile photo updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload your profile photo.");
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
      setNotice("Profile photo removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove your profile photo.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <LoadingState />;
  return (
    <Screen title="Your profile" subtitle="Manage your account and preferences.">
      {error ? <Notice message={error} /> : null}
      {preferencesError ? <Notice message={preferencesError} /> : null}
      {notice ? <Notice message={notice} variant="success" /> : null}
      {profile ? (
        <>
          <Panel style={styles.profilePanel}>
            {profile.hasAvatar && avatarSource ? (
              <Image
                alt="Profile photo"
                source={avatarSource}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.email}>{profile.email}</Text>
            <AppButton
              label="Choose profile photo"
              loading={busy === "avatar"}
              onPress={() => void chooseAvatar()}
              variant="secondary"
            />
            {profile.hasAvatar ? (
              <AppButton
                disabled={Boolean(busy)}
                label="Remove photo"
                onPress={() => void removeAvatar()}
                variant="danger"
              />
            ) : null}
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText style={styles.heading}>Account details</LocalizedText>
            <TextField label="Name" maxLength={100} onChangeText={setName} value={name} />
            <AppButton
              disabled={!name.trim() || name.trim() === profile.name}
              label="Save name"
              loading={busy === "name"}
              onPress={() => void saveName()}
            />
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText style={styles.heading}>Change password</LocalizedText>
            <TextField
              label="Current password"
              onChangeText={setCurrentPassword}
              secureTextEntry
              value={currentPassword}
            />
            <TextField
              label="New password"
              onChangeText={setNewPassword}
              secureTextEntry
              value={newPassword}
            />
            <TextField
              label="Confirm new password"
              onChangeText={setConfirmPassword}
              secureTextEntry
              value={confirmPassword}
            />
            <AppButton
              disabled={!currentPassword || !newPassword || !confirmPassword}
              label="Update password"
              loading={busy === "password"}
              onPress={() => void changePassword()}
              variant="secondary"
            />
            <AppButton
              label="Forgot password?"
              onPress={() => router.push("/(auth)/forgot-password")}
              variant="secondary"
            />
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText style={styles.heading}>Your library</LocalizedText>
            <AppButton
              label="Manage collections"
              onPress={() => router.push("/collections")}
              variant="secondary"
            />
          </Panel>
          <Panel style={styles.form}>
            <LocalizedText style={styles.heading}>Preferences</LocalizedText>
            <OptionSelector
              label="Language"
              multiple={false}
              onChange={(values) => {
                const value = values[0];
                if (value === "en" || value === "el") {
                  setError("");
                  void setLocale(value).catch((cause: unknown) => {
                    setError(cause instanceof Error ? cause.message : "Could not save your language preference.");
                  });
                }
              }}
              options={[
                { value: "en", label: "English" },
                { value: "el", label: "Greek" },
              ]}
              selected={[locale]}
            />
            <OptionSelector
              label="Appearance"
              multiple={false}
              onChange={(values) => {
                const value = values[0];
                if (value === "system" || value === "light" || value === "dark") {
                  setError("");
                  void setTheme(value).catch((cause: unknown) => {
                    setError(cause instanceof Error ? cause.message : "Could not save your appearance preference.");
                  });
                }
              }}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              selected={[theme]}
            />
          </Panel>
          <AppButton label="Sign out" onPress={() => void signOut()} variant="danger" />
        </>
      ) : (
        <AppButton label="Try again" onPress={() => void loadProfile()} variant="secondary" />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  profilePanel: { alignItems: "center", gap: spacing.md },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  avatarInitial: { color: colors.primary, fontSize: 40, fontWeight: "800" },
  email: { color: colors.muted, fontSize: 14 },
  form: { gap: spacing.md },
  heading: { color: colors.text, fontSize: 17, fontWeight: "800" },
});
