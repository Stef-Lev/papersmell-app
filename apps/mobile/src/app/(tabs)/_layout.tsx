import { Redirect } from "expo-router";
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import {
  ChartNoAxesCombined,
  Home,
  Library,
  Search,
  UserRound,
} from "lucide-react-native";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "../../components/loading-state";
import { useAuth } from "../../providers/auth-provider";
import { usePreferences } from "../../providers/preferences-provider";
import { translateMessage } from "../../lib/translation";
import { radius, spacing } from "../../lib/theme";

function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const { colors } = usePreferences();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const tabBarWidth = Math.min(screenWidth - spacing.lg * 2, 384);

  return (
    <View
      style={[
        styles.tabBar,
        {
          start: (screenWidth - tabBarWidth) / 2,
          end: (screenWidth - tabBarWidth) / 2,
          bottom: Math.max(insets.bottom, spacing.lg),
          width: tabBarWidth,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const accessibilityLabel =
          options.tabBarAccessibilityLabel ?? options.title ?? route.name;
        const onPress = () => {
          const event = emitter.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
            accessibilityState={{ selected: focused }}
            onLongPress={() =>
              emitter.emit({ type: "tabLongPress", target: route.key })
            }
            onPress={onPress}
            testID={options.tabBarButtonTestID}
            style={styles.tabBarItem}
          >
            <View style={styles.icon}>
              {focused && (
                <Svg
                  height={48}
                  style={StyleSheet.absoluteFill}
                  viewBox="0 0 48 48"
                  width={48}
                >
                  <Circle
                    cx={24}
                    cy={24}
                    fill={colors.primarySoft}
                    r={24}
                  />
                </Svg>
              )}
              {options.tabBarIcon?.({
                color: focused ? colors.primary : colors.text,
                focused,
                size: 24,
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { session, isLoading } = useAuth();
  const { colors, locale } = usePreferences();
  if (isLoading) return <LoadingState />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarShowLabel: false,
        tabBarStyle: { height: 66 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: translateMessage("mobile.navigation.home", locale),
          tabBarAccessibilityLabel: translateMessage(
            "mobile.navigation.home",
            locale,
          ),
          tabBarIcon: ({ color }) => (
            <Home color={color} size={24} strokeWidth={2.25} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: translateMessage("mobile.navigation.library", locale),
          tabBarAccessibilityLabel: translateMessage(
            "mobile.navigation.library",
            locale,
          ),
          tabBarIcon: ({ color }) => (
            <Library color={color} size={24} strokeWidth={2.25} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: translateMessage("mobile.navigation.discover", locale),
          tabBarAccessibilityLabel: translateMessage(
            "mobile.navigation.discoverBooks",
            locale,
          ),
          tabBarIcon: ({ color }) => (
            <Search color={color} size={24} strokeWidth={2.25} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: translateMessage("mobile.navigation.insights", locale),
          tabBarAccessibilityLabel: translateMessage(
            "mobile.navigation.readingInsights",
            locale,
          ),
          tabBarIcon: ({ color }) => (
            <ChartNoAxesCombined color={color} size={24} strokeWidth={2.25} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translateMessage("mobile.navigation.profile", locale),
          tabBarAccessibilityLabel: translateMessage(
            "mobile.navigation.profilePreferences",
            locale,
          ),
          tabBarIcon: ({ color }) => (
            <UserRound color={color} size={24} strokeWidth={2.25} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 66,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarItem: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  icon: {
    position: "relative",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
