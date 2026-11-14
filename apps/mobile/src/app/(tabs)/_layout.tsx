import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { LoadingState } from "../../components/loading-state";
import { useAuth } from "../../providers/auth-provider";
import { usePreferences } from "../../providers/preferences-provider";
import { translateText } from "../../lib/translation";

const icons = {
  home: "⌂",
  library: "▤",
  search: "⌕",
  analytics: "▥",
  profile: "●",
};

export default function TabLayout() {
  const { session, isLoading } = useAuth();
  const { colors, locale } = usePreferences();
  if (isLoading) return <LoadingState />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: translateText("Home", locale),
          tabBarAccessibilityLabel: translateText("Home", locale),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>{icons.home}</Text>,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: translateText("Library", locale),
          tabBarAccessibilityLabel: translateText("Library", locale),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{icons.library}</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: translateText("Discover", locale),
          tabBarAccessibilityLabel: translateText("Discover books", locale),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>{icons.search}</Text>,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: translateText("Insights", locale),
          tabBarAccessibilityLabel: translateText("Reading insights", locale),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{icons.analytics}</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translateText("Profile", locale),
          tabBarAccessibilityLabel: translateText("Profile and preferences", locale),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17 }}>{icons.profile}</Text>,
        }}
      />
    </Tabs>
  );
}
