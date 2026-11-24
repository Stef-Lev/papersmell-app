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
import { getErrorMessage } from "../../lib/translation";
import { usePreferences } from "../../providers/preferences-provider";
import { useThemedStyles } from "../../lib/use-themed-styles";

export default function ForgotPasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
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
      setError(getErrorMessage(cause, locale, "mobile.errors.requestReset"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text messageKey="mobile.auth.resetTitle" style={styles.title} />
        <Text messageKey="mobile.auth.resetDescription" style={styles.description} />
        <Panel style={styles.form}>
          {error ? <Notice message={error} /> : null}
          {sent ? (
            <Notice messageKey="mobile.auth.resetSent" variant="success" />
          ) : null}
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="mobile.auth.email"
            onChangeText={setEmail}
            value={email}
          />
          <AppButton
            disabled={!email.trim()}
            label="mobile.auth.sendResetLink"
            loading={busy}
            onPress={() => void submit()}
          />
          <Pressable onPress={() => router.back()} style={styles.link}>
            <Text messageKey="mobile.auth.backToSignIn" style={styles.linkText} />
          </Pressable>
          <Pressable onPress={() => router.push("/reset-password")} style={styles.link}>
            <Text messageKey="mobile.auth.haveResetToken" style={styles.linkText} />
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
