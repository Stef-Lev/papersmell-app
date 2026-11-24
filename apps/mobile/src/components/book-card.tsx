import { Pressable, StyleSheet, Text, View } from "react-native";
import { LocalizedText } from "./localized-text";
import type { BookEntry, CatalogBook, Shelf } from "../lib/types";
import { radius, spacing } from "../lib/theme";
import { BookCover } from "./book-cover";
import { Panel } from "./panel";
import { ProgressBar } from "./progress-bar";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import {
  getShelfMessageKey,
  translateMessage,
  type MobileMessageKey,
} from "../lib/translation";

type Props = {
  book: CatalogBook | BookEntry["book"];
  status?: Shelf;
  rating?: number | null;
  currentPage?: number;
  actionLabel?: MobileMessageKey;
  onPress?: () => void;
};

export function BookCard({
  book,
  status,
  rating,
  currentPage,
  actionLabel,
  onPress,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
  const content = (
    <Panel style={styles.panel}>
      <BookCover compact url={book.coverUrl} title={book.title} />
      <View style={styles.details}>
        <Text numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>
        {book.authors.length ? (
          <Text numberOfLines={1} style={styles.author}>
            {book.authors.join(", ")}
          </Text>
        ) : (
          <LocalizedText
            messageKey="mobile.common.unknownAuthor"
            numberOfLines={1}
            style={styles.author}
          />
        )}
        {book.pageCount > 0 ? (
          <Text style={styles.metadata}>
            {book.pageCount}{" "}
            {translateMessage(
              book.pageCount === 1 ? "mobile.common.page" : "mobile.common.pages",
              locale,
            )}
          </Text>
        ) : null}
        {status === "currently-reading" && currentPage !== undefined ? (
          <ProgressBar currentPage={currentPage} pageCount={book.pageCount} />
        ) : null}
        {status || rating ? (
          status ? (
            <LocalizedText
              messageKey={getShelfMessageKey(status)}
              style={styles.badge}
            />
          ) : (
            <LocalizedText
              messageKey="mobile.bookCard.rating"
              style={styles.badge}
              values={{ rating: rating ?? 0 }}
            />
          )
        ) : null}
        {actionLabel ? (
          <LocalizedText messageKey={actionLabel} style={styles.action} />
        ) : null}
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Panel>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}${actionLabel ? `, ${translateMessage(actionLabel, locale)}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  details: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 20 },
  author: { color: colors.muted, fontSize: 13 },
  metadata: { color: colors.muted, fontSize: 12 },
  badge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  action: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  chevron: { color: colors.primary, fontSize: 28 },
  pressed: { opacity: 0.75 },
});
