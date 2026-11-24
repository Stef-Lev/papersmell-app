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
import { getErrorMessage, translateMessage } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import { usePreferences } from "../providers/preferences-provider";

export default function CollectionsScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
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
      setNotice(translateMessage("mobile.collections.created", locale));
    } catch (cause) {
      setNotice(getErrorMessage(cause, locale, "mobile.errors.collectionCreate"));
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
      setNotice(translateMessage("mobile.collections.renamed", locale));
    } catch (cause) {
      setNotice(getErrorMessage(cause, locale, "mobile.errors.collectionRename"));
    } finally {
      setBusy("");
    }
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      translateMessage("mobile.collections.deleteTitle", locale),
      translateMessage("mobile.collections.deleteDescription", locale, { name }),
      [
        { text: translateMessage("mobile.common.cancel", locale), style: "cancel" },
        {
          text: translateMessage("mobile.collections.delete", locale),
          style: "destructive",
          onPress: () => {
            setBusy(id);
            mobileApi
              .deleteCollection(id)
              .then(async () => {
                await refresh();
                setNotice(translateMessage("mobile.collections.deleted", locale));
              })
              .catch((cause: unknown) =>
                setNotice(
                  getErrorMessage(cause, locale, "mobile.errors.collectionDelete"),
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
    <Screen
      titleKey="mobile.collections.title"
      subtitleKey="mobile.collections.subtitle"
    >
      {error ? <Notice message={error} /> : null}
      {notice ? <Notice message={notice} variant="success" /> : null}
      <Panel style={styles.form}>
        <TextField
          label="mobile.collections.newCollection"
          maxLength={50}
          onChangeText={setNewName}
          placeholder="mobile.collections.exampleName"
          value={newName}
        />
        <AppButton
          disabled={!newName.trim()}
          label="mobile.collections.create"
          loading={busy === "create"}
          onPress={() => void createCollection()}
        />
      </Panel>
      {collections.length ? (
        collections.map((collection) => (
          <Panel key={collection.id} style={styles.collection}>
            <TextField
              label="mobile.collections.collectionName"
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
                label="mobile.collections.save"
                loading={busy === collection.id}
                onPress={() => void renameCollection(collection.id)}
                variant="outline"
                style={styles.action}
              />
              <AppButton
                disabled={Boolean(busy)}
                label="mobile.collections.delete"
                onPress={() => confirmDelete(collection.id, collection.name)}
                variant="destructive"
                style={styles.action}
              />
            </View>
          </Panel>
        ))
      ) : (
        <Panel>
          <LocalizedText
            messageKey="mobile.collections.empty"
            style={styles.empty}
          />
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
