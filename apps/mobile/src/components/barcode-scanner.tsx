import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { AppButton } from "./app-button";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { normalizeBarcodeIsbn } from "../lib/barcode-isbn";
import { usePreferences } from "../providers/preferences-provider";
import { translateMessage } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function BarcodeScanner({
  onClose,
  onScanned,
}: {
  onClose: () => void;
  onScanned: (isbn: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const { colors, locale } = usePreferences();
  const styles = useThemedStyles(createStyles);

  function handleBarcode(data: string) {
    if (locked) return;
    const isbn = normalizeBarcodeIsbn(data);
    if (!isbn) return;
    setLocked(true);
    onScanned(isbn);
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      visible
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text messageKey="mobile.scanner.title" style={styles.title} />
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text messageKey="mobile.scanner.close" style={styles.close} />
          </Pressable>
        </View>
        {permission?.granted ? (
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
            onBarcodeScanned={({ data }) => handleBarcode(data)}
            onMountError={({ message }) => setCameraError(message)}
            style={styles.camera}
          />
        ) : permission ? (
          <View style={styles.permission}>
            <Text
              messageKey="mobile.scanner.cameraPermission"
              style={styles.message}
            />
            <AppButton
              label={
                permission.canAskAgain
                  ? "mobile.scanner.allowCamera"
                  : "mobile.scanner.cameraUnavailable"
              }
              onPress={() => {
                if (permission.canAskAgain) void requestPermission();
              }}
              disabled={!permission.canAskAgain}
            />
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
        <Text style={styles.hint}>
          {cameraError
            ? translateMessage("mobile.scanner.cameraError", locale, {
                error: cameraError,
              })
            : translateMessage("mobile.scanner.hint", locale)}
        </Text>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  close: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  camera: { height: "65%", overflow: "hidden", borderRadius: radius.xxl },
  permission: { alignItems: "center", gap: spacing.lg, padding: spacing.xl },
  message: { color: colors.text, fontSize: 15, textAlign: "center" },
  hint: { color: colors.muted, textAlign: "center", fontSize: 14 },
});
