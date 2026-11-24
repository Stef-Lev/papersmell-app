import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalizedText as Text } from "../components/localized-text";
import { AppButton } from "../components/app-button";
import { Notice } from "../components/notice";
import { Panel } from "../components/panel";
import { TextField } from "../components/text-field";
import { mobileApi } from "../lib/api";
import { spacing, type ThemeColors } from "../lib/theme";
import { getErrorMessage, translateMessage } from "../lib/translation";
import { usePreferences } from "../providers/preferences-provider";
import { useThemedStyles } from "../lib/use-themed-styles";

export default function ResetPasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(
    typeof params.token === "string" ? params.token : "",
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!token.trim() || !password || busy) return;
    if (password !== confirmation) {
      setError(translateMessage("mobile.errors.passwordsMismatch", locale));
      return;
    }
    if (password.length < 6) {
      setError(translateMessage("mobile.errors.passwordMinLength", locale));
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await mobileApi.resetPassword(token.trim(), password);
      setNotice(translateMessage("mobile.errors.passwordResetSuccess", locale));
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.resetPassword"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text messageKey="mobile.auth.chooseNewPassword" style={styles.title} />
        <Text messageKey="mobile.auth.resetTokenDescription" style={styles.description} />
        <Panel style={styles.form}>
          {error ? <Notice message={error} /> : null}
          {notice ? <Notice message={notice} variant="success" /> : null}
          <TextField
            autoCapitalize="none"
            label="mobile.auth.resetToken"
            onChangeText={setToken}
            value={token}
          />
          <TextField
            label="mobile.auth.newPassword"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <TextField
            label="mobile.auth.confirmNewPassword"
            onChangeText={setConfirmation}
            secureTextEntry
            value={confirmation}
          />
          {notice ? (
            <AppButton
              label="mobile.auth.goToSignIn"
              onPress={() => router.replace("/(auth)/login")}
            />
          ) : (
            <>
              <AppButton
                disabled={!token.trim() || !password || !confirmation}
                label="mobile.auth.resetPassword"
                loading={busy}
                onPress={() => void submit()}
              />
              <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.link}>
                <Text messageKey="mobile.auth.backToSignIn" style={styles.linkText} />
              </Pressable>
            </>
          )}
        </Panel>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, justifyContent: "center", backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.xl },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  form: { gap: spacing.lg },
  link: { alignItems: "center", paddingVertical: spacing.xs },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
});
