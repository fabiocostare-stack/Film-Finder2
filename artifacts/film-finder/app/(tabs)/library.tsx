import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilmCard } from "@/components/FilmCard";
import { ProfileShortcut } from "@/components/ProfileShortcut";
import { usePreferences } from "@/context/PreferencesContext";
import { useMovieCredits } from "@/hooks/useMovieCredits";
import { useColors } from "@/hooks/useColors";

type LibraryFilter = "saved" | "watched";

const FILTER_BUTTONS: Array<{
  key: LibraryFilter;
  label: string;
  icon: "bookmark" | "check-circle";
}> = [
  { key: "saved", label: "Da guardare", icon: "bookmark" },
  { key: "watched", label: "Già visti", icon: "check-circle" },
];

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences, toggleWatchedMovie, toggleSavedMovie } = usePreferences();
  const [selectedFilter, setSelectedFilter] = useState<LibraryFilter | null>(
    null,
  );

  const savedIds = new Set(preferences.savedMovies.map((movie) => movie.id));
  const movieCredits = useMovieCredits([
    ...preferences.savedMovies.map((movie) => movie.id),
    ...preferences.watchedMovies.map((movie) => movie.id),
  ]);

  const showSaved = selectedFilter === null || selectedFilter === "saved";
  const showWatched = selectedFilter === null || selectedFilter === "watched";

  const handleToggleFilter = (filter: LibraryFilter) => {
    setSelectedFilter((current) => (current === filter ? null : filter));
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 10,
          paddingBottom: Platform.OS === "web" ? 110 : 36,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          LA TUA CINETECA
        </Text>
        <ProfileShortcut />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        La mia lista
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Film da guardare e film che hai già visto.
      </Text>

      <View style={styles.filterBar}>
        {FILTER_BUTTONS.map(({ key, label, icon }) => {
          const active = selectedFilter === key;
          const count =
            key === "saved"
              ? preferences.savedMovies.length
              : preferences.watchedMovies.length;
          return (
            <Pressable
              key={key}
              testID={`library-filter-${key}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => handleToggleFilter(key)}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Feather
                name={icon}
                size={15}
                color={active ? colors.primaryForeground : colors.primary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: active
                      ? colors.primaryForeground
                      : colors.foreground,
                  },
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.filterCountBadge,
                  {
                    backgroundColor: active
                      ? colors.primaryForeground
                      : colors.secondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    { color: active ? colors.primary : colors.foreground },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {showSaved ? (
        <>
          <SectionTitle
            icon="bookmark"
            title="Da guardare"
            count={preferences.savedMovies.length}
          />
          {preferences.savedMovies.length > 0 ? (
            <View style={styles.list}>
              {preferences.savedMovies.map((movie) => (
                <FilmCard
                  key={`saved-${movie.id}`}
                  movie={movie}
                  credits={movieCredits.creditsByMovieId.get(movie.id)}
                  creditsLoading={
                    movieCredits.isFetching &&
                    !movieCredits.creditsByMovieId.has(movie.id)
                  }
                  isWatched={preferences.watchedMovies.some(
                    (item) => item.id === movie.id,
                  )}
                  isSaved={savedIds.has(movie.id)}
                  onToggleWatched={toggleWatchedMovie}
                  onToggleSave={toggleSavedMovie}
                />
              ))}
            </View>
          ) : (
            <EmptyCollection
              icon="bookmark"
              title="La lista è ancora vuota"
              message="Aggiungi qui i film che vuoi tenere da parte."
            />
          )}
        </>
      ) : null}

      {showWatched ? (
        <>
          <SectionTitle
            icon="check-circle"
            title="Già visti"
            count={preferences.watchedMovies.length}
          />
          {preferences.watchedMovies.length > 0 ? (
            <View style={styles.list}>
              {preferences.watchedMovies.map((movie) => (
                <FilmCard
                  key={`watched-${movie.id}`}
                  movie={movie}
                  credits={movieCredits.creditsByMovieId.get(movie.id)}
                  creditsLoading={
                    movieCredits.isFetching &&
                    !movieCredits.creditsByMovieId.has(movie.id)
                  }
                  isWatched
                  isSaved={savedIds.has(movie.id)}
                  onToggleWatched={toggleWatchedMovie}
                  onToggleSave={toggleSavedMovie}
                />
              ))}
            </View>
          ) : (
            <EmptyCollection
              icon="check-circle"
              title="Nessun film segnato come già visto"
              message="Quando hai già guardato un film, segnalo così aiuterà a scegliere i prossimi consigli."
            />
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: "bookmark" | "check-circle";
  title: string;
  count: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionLead}>
        <Feather name={icon} size={17} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {count}
      </Text>
    </View>
  );
}

function EmptyCollection({
  icon,
  title,
  message,
}: {
  icon: "bookmark" | "check-circle";
  title: string;
  message: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <Feather name={icon} size={19} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 15 },
  eyebrow: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    marginTop: -5,
    fontSize: 32,
    letterSpacing: -1,
    fontFamily: "Inter_700Bold",
  },
  description: {
    marginTop: -9,
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 21,
  },
  filterBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filterCountBadge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  sectionTitleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLead: { flexDirection: "row", alignItems: "center", gap: 9 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  count: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list: { gap: 13 },
  empty: {
    minHeight: 142,
    padding: 20,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyMessage: {
    maxWidth: 290,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
});
