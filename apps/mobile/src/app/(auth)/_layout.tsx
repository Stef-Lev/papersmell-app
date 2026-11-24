import { Redirect, Stack } from "expo-router";
import { LoadingState } from "../../components/loading-state";
import { useAuth } from "../../providers/auth-provider";
import { usePreferences } from "../../providers/preferences-provider";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  const { colors } = usePreferences();
  if (isLoading) return <LoadingState label="mobile.common.opening" />;
  if (session) return <Redirect href="/(tabs)/home" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
