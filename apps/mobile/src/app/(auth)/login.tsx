import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalizedText as Text } from "../../components/localized-text";
import { BrandMark } from "../../components/brand-mark";
import { AppButton } from "../../components/app-button";
import { Notice } from "../../components/notice";
import { Panel } from "../../components/panel";
import { TextField } from "../../components/text-field";
import { spacing, type ThemeColors } from "../../lib/theme";
import { getErrorMessage, translateMessage } from "../../lib/translation";
import { useAuth } from "../../providers/auth-provider";
import { usePreferences } from "../../providers/preferences-provider";
import { useThemedStyles } from "../../lib/use-themed-styles";

export default function LoginScreen() {
  const styles = useThemedStyles(createStyles);
  const { signIn, authError } = useAuth();
  const { locale } = usePreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError(translateMessage("mobile.errors.validEmailPassword", locale));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.signIn"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <BrandMark />
          <Text style={styles.brandName}>PaperSmell</Text>
        </View>
        <View style={styles.intro}>
          <Text messageKey="mobile.auth.login" style={styles.title} />
          <Text messageKey="mobile.auth.welcome" style={styles.subtitle} />
        </View>
        <Panel style={styles.form}>
          {authError ? <Notice message={authError} /> : null}
          {error ? <Notice message={error} /> : null}
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="mobile.auth.email"
            onChangeText={setEmail}
            value={email}
          />
          <TextField
            autoCapitalize="none"
            label="mobile.auth.password"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <AppButton
            label="mobile.auth.login"
            loading={busy}
            onPress={() => void submit()}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.link}
          >
            <Text messageKey="mobile.auth.forgotPassword" style={styles.linkText} />
          </Pressable>
          <View style={styles.footer}>
            <Text messageKey="mobile.auth.noAccount" style={styles.footerText} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(auth)/register")}
              style={styles.footerLink}
            >
              <Text messageKey="mobile.auth.createAccount" style={styles.linkText} />
            </Pressable>
          </View>
        </Panel>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, justifyContent: "center", backgroundColor: colors.background },
  content: { gap: spacing.xl, padding: spacing.xl },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  brandName: { color: colors.text, fontSize: 18, fontWeight: "800" },
  intro: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  form: { gap: spacing.lg, padding: spacing.xl },
  link: { alignItems: "center", paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: "600", textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { color: colors.muted, fontSize: 14 },
  footerLink: { paddingVertical: spacing.sm, paddingLeft: spacing.xs },
});
