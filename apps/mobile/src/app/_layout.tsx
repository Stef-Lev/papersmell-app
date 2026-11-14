import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../providers/auth-provider";
import { PreferencesProvider, usePreferences } from "../providers/preferences-provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { colors, resolvedTheme } = usePreferences();
  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
    </>
  );
}
