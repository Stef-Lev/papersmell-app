import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalizedText as Text } from "../../components/localized-text";
import { AppButton } from "../../components/app-button";
import { Notice } from "../../components/notice";
import { Panel } from "../../components/panel";
import { TextField } from "../../components/text-field";
import { radius, spacing, type ThemeColors } from "../../lib/theme";
import { useAuth } from "../../providers/auth-provider";
import { useThemedStyles } from "../../lib/use-themed-styles";

export default function LoginScreen() {
  const styles = useThemedStyles(createStyles);
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.mark}><Text style={styles.markText}>P</Text></View>
          <Text style={styles.brandName}>PaperSmell</Text>
        </View>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>YOUR READING COMPANION</Text>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>
        </View>
        <Panel style={styles.form}>
          {authError ? <Notice message={authError} /> : null}
          {error ? <Notice message={error} /> : null}
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <TextField
            autoCapitalize="none"
            label="Password"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <AppButton
            disabled={!email.trim() || !password}
            label="Sign in"
            loading={busy}
            onPress={() => void submit()}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.link}
          >
            <Text style={styles.linkText}>Forgot your password?</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/register")}
            style={styles.link}
          >
            <Text style={styles.linkText}>New to PaperSmell? Create an account</Text>
          </Pressable>
        </Panel>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, justifyContent: "center", backgroundColor: colors.background },
  content: { gap: spacing.xl, padding: spacing.xl },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  mark: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  markText: { color: colors.white, fontSize: 22, fontWeight: "800" },
  brandName: { color: colors.text, fontSize: 18, fontWeight: "800" },
  intro: { gap: spacing.sm, marginTop: spacing.xl },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 34, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  form: { gap: spacing.lg, padding: spacing.xl },
  link: { alignItems: "center", paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: "600", textAlign: "center" },
});
