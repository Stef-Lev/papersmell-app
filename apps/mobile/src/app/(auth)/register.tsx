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

export default function RegisterScreen() {
  const styles = useThemedStyles(createStyles);
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account.");
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
          <Text style={styles.eyebrow}>A SHELF OF YOUR OWN</Text>
          <Text style={styles.title}>Create your account.</Text>
          <Text style={styles.subtitle}>Keep your reading life in one place.</Text>
        </View>
        <Panel style={styles.form}>
          {error ? <Notice message={error} /> : null}
          <TextField label="Name" onChangeText={setName} value={name} />
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            value={email}
          />
          <TextField
            autoCapitalize="none"
            label="Password (at least 8 characters)"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <AppButton
            disabled={!name.trim() || !email.trim() || password.length < 8}
            label="Create account"
            loading={busy}
            onPress={() => void submit()}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/(auth)/login")}
            style={styles.link}
          >
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
