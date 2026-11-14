import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { LocalizedText } from "../components/localized-text";
import { AppButton } from "../components/app-button";
import { LoadingState } from "../components/loading-state";
import { Notice } from "../components/notice";
import { Panel } from "../components/panel";
import { Screen } from "../components/screen";
import { TextField } from "../components/text-field";
import { useLibrary } from "../hooks/use-library";
import { mobileApi } from "../lib/api";
import { spacing, type ThemeColors } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";

export default function CollectionsScreen() {
  const styles = useThemedStyles(createStyles);
  const { collections, isLoading, error, refresh } = useLibrary();
  const [newName, setNewName] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  async function createCollection() {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy("create");
    setNotice("");
    try {
      await mobileApi.createCollection(name);
      setNewName("");
      await refresh();
      setNotice("Collection created.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not create collection.");
    } finally {
      setBusy("");
    }
  }

  async function renameCollection(id: string) {
    const name = (names[id] ?? collections.find((item) => item.id === id)?.name ?? "").trim();
    if (!name || busy) return;
    setBusy(id);
    setNotice("");
    try {
      await mobileApi.renameCollection(id, name);
      await refresh();
      setNotice("Collection renamed.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not rename collection.");
    } finally {
      setBusy("");
    }
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      "Delete collection?",
      `“${name}” will be deleted. Books in it will remain in your library.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setBusy(id);
            mobileApi
              .deleteCollection(id)
              .then(async () => {
                await refresh();
                setNotice("Collection deleted.");
              })
              .catch((cause: unknown) =>
                setNotice(
                  cause instanceof Error ? cause.message : "Could not delete collection.",
                ),
              )
              .finally(() => setBusy(""));
          },
        },
      ],
    );
  }

  if (isLoading) return <LoadingState />;
  return (
    <Screen title="Collections" subtitle="Group books into lists that make sense to you.">
      {error ? <Notice message={error} /> : null}
      {notice ? <Notice message={notice} variant="success" /> : null}
      <Panel style={styles.form}>
        <TextField
          label="New collection"
          maxLength={50}
          onChangeText={setNewName}
          placeholder="e.g. Summer reading"
          value={newName}
        />
        <AppButton
          disabled={!newName.trim()}
          label="Create collection"
          loading={busy === "create"}
          onPress={() => void createCollection()}
        />
      </Panel>
      {collections.length ? (
        collections.map((collection) => (
          <Panel key={collection.id} style={styles.collection}>
            <TextField
              label="Collection name"
              maxLength={50}
              onChangeText={(name) =>
                setNames((current) => ({ ...current, [collection.id]: name }))
              }
              value={names[collection.id] ?? collection.name}
            />
            <View style={styles.actions}>
              <AppButton
                disabled={
                  !(names[collection.id] ?? collection.name).trim() ||
                  (names[collection.id] ?? collection.name) === collection.name
                }
                label="Save"
                loading={busy === collection.id}
                onPress={() => void renameCollection(collection.id)}
                variant="secondary"
                style={styles.action}
              />
              <AppButton
                disabled={Boolean(busy)}
                label="Delete"
                onPress={() => confirmDelete(collection.id, collection.name)}
                variant="danger"
                style={styles.action}
              />
            </View>
          </Panel>
        ))
      ) : (
        <Panel>
          <LocalizedText style={styles.empty}>You have not created any collections yet.</LocalizedText>
        </Panel>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: spacing.md },
  collection: { gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.md },
  action: { flex: 1 },
  empty: { color: colors.muted, fontSize: 14 },
});
