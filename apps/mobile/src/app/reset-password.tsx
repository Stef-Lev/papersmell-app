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
import { useThemedStyles } from "../lib/use-themed-styles";

export default function ResetPasswordScreen() {
  const styles = useThemedStyles(createStyles);
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
      setError("The passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await mobileApi.resetPassword(token.trim(), password);
      setNotice("Password reset successfully. You can now sign in.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.description}>
          Paste the token from your reset email. Reset links expire after 10 minutes.
        </Text>
        <Panel style={styles.form}>
          {error ? <Notice message={error} /> : null}
          {notice ? <Notice message={notice} variant="success" /> : null}
          <TextField
            autoCapitalize="none"
            label="Reset token"
            onChangeText={setToken}
            value={token}
          />
          <TextField
            label="New password"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <TextField
            label="Confirm new password"
            onChangeText={setConfirmation}
            secureTextEntry
            value={confirmation}
          />
          {notice ? (
            <AppButton
              label="Go to sign in"
              onPress={() => router.replace("/(auth)/login")}
            />
          ) : (
            <>
              <AppButton
                disabled={!token.trim() || !password || !confirmation}
                label="Reset password"
                loading={busy}
                onPress={() => void submit()}
              />
              <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.link}>
                <Text style={styles.linkText}>Back to sign in</Text>
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
