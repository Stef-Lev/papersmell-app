import { Redirect } from "expo-router";
import { LoadingState } from "../components/loading-state";
import { useAuth } from "../providers/auth-provider";

export default function IndexScreen() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <LoadingState label="Opening PaperSmell…" />;
  return <Redirect href={session ? "/(tabs)/home" : "/(auth)/login"} />;
}
