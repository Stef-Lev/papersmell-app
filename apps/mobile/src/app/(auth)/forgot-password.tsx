import { useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalizedText as Text } from "../../components/localized-text";
import { AppButton } from "../../components/app-button";
import { Notice } from "../../components/notice";
import { Panel } from "../../components/panel";
import { TextField } from "../../components/text-field";
import { mobileApi } from "../../lib/api";
import { spacing, type ThemeColors } from "../../lib/theme";
import { useThemedStyles } from "../../lib/use-themed-styles";

export default function ForgotPasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError("");
    setSent(false);
    try {
      await mobileApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request a reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.description}>
          Enter your email address and we’ll send a time-limited password reset link.
        </Text>
        <Panel style={styles.form}>
          {error ? <Notice message={error} /> : null}
          {sent ? (
            <Notice
              message="If an account exists for that email, a reset link has been sent. You can open it on the web or paste its token in the mobile reset screen."
              variant="success"
            />
          ) : null}
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            value={email}
          />
          <AppButton
            disabled={!email.trim()}
            label="Send reset link"
            loading={busy}
            onPress={() => void submit()}
          />
          <Pressable onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>Back to sign in</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/reset-password")} style={styles.link}>
            <Text style={styles.linkText}>I have a reset token</Text>
          </Pressable>
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
