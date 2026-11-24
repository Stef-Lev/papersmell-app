import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookCard } from "../components/book-card";
import { EmptyState } from "../components/empty-state";
import { LoadingState } from "../components/loading-state";
import { Notice } from "../components/notice";
import { Panel } from "../components/panel";
import { Screen } from "../components/screen";
import { getMonthCalendar } from "../lib/reading-calendar";
import { radius, spacing, type ThemeColors } from "../lib/theme";
import { useLibrary } from "../hooks/use-library";
import { useThemedStyles } from "../lib/use-themed-styles";
import { usePreferences } from "../providers/preferences-provider";
import { translateMessage } from "../lib/translation";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
  const { entries, isLoading, error } = useLibrary();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [selectedDate, setSelectedDate] = useState(() => dateOnly(new Date()));
  const year = month.getUTCFullYear();
  const monthNumber = month.getUTCMonth();
  const days = useMemo(
    () => getMonthCalendar(entries, year, monthNumber),
    [entries, year, monthNumber],
  );
  const selectedBooks =
    days.find((day) => day?.date === selectedDate)?.books ?? [];
  const monthLabel = new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month);
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-US", {
      weekday: "narrow",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 7 + index))),
  );

  function changeMonth(delta: number) {
    const nextMonth = new Date(Date.UTC(year, monthNumber + delta, 1));
    setMonth(nextMonth);
    setSelectedDate(dateOnly(nextMonth));
  }

  if (isLoading) return <LoadingState />;
  return (
    <Screen
      titleKey="mobile.calendar.title"
      subtitleKey="mobile.calendar.subtitle"
    >
      {error ? <Notice message={error} /> : null}
      <Panel style={styles.calendar}>
        <View style={styles.monthHeader}>
          <Pressable
            accessibilityLabel={translateMessage("mobile.calendar.previousMonth", locale)}
            accessibilityRole="button"
            onPress={() => changeMonth(-1)}
            style={styles.monthButton}
          >
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <Pressable
            accessibilityLabel={translateMessage("mobile.calendar.nextMonth", locale)}
            accessibilityRole="button"
            onPress={() => changeMonth(1)}
            style={styles.monthButton}
          >
            <Text style={styles.monthArrow}>›</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {weekdays.map((day, index) => (
            <View key={`${day}-${index}`} style={styles.dayCell}>
              <Text style={styles.weekday}>{day}</Text>
            </View>
          ))}
          {days.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
            const selected = day.date === selectedDate;
            return (
              <Pressable
                accessibilityLabel={translateMessage(
                  "mobile.calendar.dayAccessibility",
                  locale,
                  { date: day.date, count: day.books.length },
                )}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={day.date}
                onPress={() => setSelectedDate(day.date)}
                style={styles.dayCell}
              >
                <View style={[styles.day, selected && styles.selectedDay]}>
                  <Text style={[styles.dayNumber, selected && styles.selectedNumber]}>
                    {day.day}
                  </Text>
                  {day.books.length ? (
                    <View style={[styles.dot, selected && styles.selectedDot]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Panel>
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>{selectedDate}</Text>
        <Text style={styles.caption}>
          {selectedBooks.length}{" "}
          {translateMessage(
            selectedBooks.length === 1 ? "mobile.common.book" : "mobile.common.books",
            locale,
          )}{" "}
          {translateMessage("mobile.common.inProgress", locale)}
        </Text>
      </View>
      {selectedBooks.length ? (
        selectedBooks.map((entry) => (
          <BookCard
            book={entry.book}
            currentPage={entry.currentPage}
            key={entry.id}
            onPress={() =>
              router.push({ pathname: "/book/[id]", params: { id: entry.id } })
            }
            status={entry.status}
          />
        ))
      ) : (
        <Panel>
          <EmptyState
            titleKey="mobile.calendar.quietDay"
            descriptionKey="mobile.calendar.emptyDescription"
          />
        </Panel>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  calendar: { gap: spacing.lg },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  monthArrow: { color: colors.primary, fontSize: 28, lineHeight: 32 },
  monthTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.2857%", alignItems: "center", padding: 2 },
  weekday: { paddingVertical: spacing.sm, color: colors.muted, fontSize: 12, fontWeight: "700" },
  day: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: radius.sm,
  },
  selectedDay: { backgroundColor: colors.primary },
  dayNumber: { color: colors.text, fontSize: 13 },
  selectedNumber: { color: colors.white, fontWeight: "800" },
  dot: { width: 4, height: 4, borderRadius: radius.pill, backgroundColor: colors.coral },
  selectedDot: { backgroundColor: colors.white },
  resultsHeader: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  caption: { color: colors.muted, fontSize: 13 },
});
