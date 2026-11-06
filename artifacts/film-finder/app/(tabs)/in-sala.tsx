import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  inferGenres,
  loadInTheaters,
  type Movie,
} from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CatalogNotice,
  getCatalogErrorMessage,
} from "@/components/CatalogNotice";
import { FilmCard } from "@/components/FilmCard";
import { ProfileShortcut } from "@/components/ProfileShortcut";
import { usePreferences } from "@/context/PreferencesContext";
import { useMovieCredits } from "@/hooks/useMovieCredits";
import { useColors } from "@/hooks/useColors";

type TasteProfile = { genreWeights: Map<number, number>; hasSignals: boolean };

function buildTasteProfile(
  watched: Movie[],
  tasteGenreIds: number[],
): TasteProfile {
  const genreWeights = new Map<number, number>();
  for (const movie of watched) {
    for (const id of movie.genreIds ?? []) {
      genreWeights.set(id, (genreWeights.get(id) ?? 0) + 1);
    }
  }
  for (const id of tasteGenreIds) {
    genreWeights.set(id, (genreWeights.get(id) ?? 0) + 3);
  }
  return { genreWeights, hasSignals: genreWeights.size > 0 };
}

function hasTasteSignals(profile: TasteProfile): boolean {
  return profile.hasSignals;
}

function rankMoviesByTasteAndRating(
  movies: Movie[],
  profile: TasteProfile,
): Movie[] {
  const total =
    [...profile.genreWeights.values()].reduce((sum, value) => sum + value, 0) ||
    1;
  const score = (movie: Movie) => {
    const taste =
      (movie.genreIds ?? []).reduce(
        (sum, id) => sum + (profile.genreWeights.get(id) ?? 0),
        0,
      ) / total;
    return taste * 10 + movie.voteAverage;
  };
  return [...movies].sort((a, b) => score(b) - score(a));
}

const REGION = "IT";
const STALE_TIME = 30 * 60 * 1000;
const MONTHS = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];

type ListMode = "now" | "upcoming";

const LIST_MODES: Array<{
  mode: ListMode;
  label: string;
  icon: "film" | "calendar";
}> = [
  { mode: "now", label: "Al cinema ora", icon: "film" },
  { mode: "upcoming", label: "Prossimamente", icon: "calendar" },
];

function formatReleaseLabel(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return null;
  return `In uscita il ${Number(day)} ${monthName} ${year}`;
}

export default function InTheatersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences, toggleWatchedMovie, toggleSavedMovie } = usePreferences();
  const [listMode, setListMode] = useState<ListMode>("now");

  const catalog = useQuery({
    queryKey: ["in-theaters-v1", REGION],
    queryFn: () => loadInTheaters(REGION),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const tasteGenreIds = useMemo(
    () => inferGenres(preferences.taste),
    [preferences.taste],
  );
  const profile = useMemo(
    () => buildTasteProfile(preferences.watchedMovies, tasteGenreIds),
    [preferences.watchedMovies, tasteGenreIds],
  );
  const personalised = hasTasteSignals(profile);

  const nowPlaying = useMemo(
    () => rankMoviesByTasteAndRating(catalog.data?.nowPlaying ?? [], profile),
    [catalog.data?.nowPlaying, profile],
  );
  const upcoming = useMemo(
    () => rankMoviesByTasteAndRating(catalog.data?.upcoming ?? [], profile),
    [catalog.data?.upcoming, profile],
  );

  const visibleMovies = listMode === "now" ? nowPlaying : upcoming;
  const movieCredits = useMovieCredits(visibleMovies.map((movie) => movie.id));
  const watchedIds = useMemo(
    () => new Set(preferences.watchedMovies.map((movie) => movie.id)),
    [preferences.watchedMovies],
  );
  const savedIds = useMemo(
    () => new Set(preferences.savedMovies.map((movie) => movie.id)),
    [preferences.savedMovies],
  );

  const renderMovie = (movie: Movie) => (
    <FilmCard
      key={movie.id}
      movie={movie}
      credits={movieCredits.creditsByMovieId.get(movie.id)}
      creditsLoading={
        movieCredits.isFetching &&
        !movieCredits.creditsByMovieId.has(movie.id)
      }
      isWatched={watchedIds.has(movie.id)}
      isSaved={savedIds.has(movie.id)}
      onToggleWatched={toggleWatchedMovie}
      onToggleSave={toggleSavedMovie}
      releaseLabel={
        listMode === "upcoming" ? formatReleaseLabel(movie.releaseDate) : null
      }
    />
  );

  const emptyMessage =
    listMode === "now"
      ? "Nessun film in programmazione nelle sale italiane in questo momento."
      : "Nessuna uscita annunciata per le sale italiane al momento.";

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
        <View style={styles.topCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            AL CINEMA
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            In sala,{"\n"}adesso.
          </Text>
        </View>
        <ProfileShortcut />
      </View>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Le sale italiane, ordinate in base ai tuoi gusti e al voto che stanno
        raggiungendo.
      </Text>

      <View style={styles.controls}>
        <View style={[styles.regionPill, { borderColor: colors.border }]}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.regionText, { color: colors.mutedForeground }]}>
            ITALIA
          </Text>
        </View>
        <Pressable
          testID="refresh-in-theaters"
          accessibilityRole="button"
          accessibilityLabel="Aggiorna i film in sala"
          disabled={catalog.isFetching}
          onPress={() => void catalog.refetch()}
          style={({ pressed }) => [
            styles.refreshButton,
            {
              borderColor: colors.border,
              opacity: pressed || catalog.isFetching ? 0.6 : 1,
            },
          ]}
        >
          {catalog.isFetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={15} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.segment,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {LIST_MODES.map(({ mode, label, icon }) => {
          const selected = listMode === mode;
          const count = mode === "now" ? nowPlaying.length : upcoming.length;
          return (
            <Pressable
              key={mode}
              testID={`in-theaters-filter-${mode}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setListMode(mode)}
              style={({ pressed }) => [
                styles.segmentButton,
                selected ? { backgroundColor: colors.primary } : null,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Feather
                name={icon}
                size={14}
                color={
                  selected ? colors.primaryForeground : colors.mutedForeground
                }
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: selected
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                  },
                ]}
              >
                {label}
              </Text>
              {count > 0 ? (
                <View
                  style={[
                    styles.segmentCount,
                    {
                      backgroundColor: selected
                        ? colors.primaryForeground
                        : colors.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentCountText,
                      { color: selected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.orderNote}>
        <Feather
          name={personalised ? "user-check" : "star"}
          size={12}
          color={colors.primary}
        />
        <Text style={[styles.orderText, { color: colors.mutedForeground }]}>
          {personalised
            ? "Ordinati per vicinanza ai tuoi gusti e voto complessivo."
            : "Ordinati per voto complessivo. Segna i film visti o descrivi i tuoi gusti nel profilo per un ordine più personale."}
        </Text>
      </View>

      {catalog.isLoading ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Cerco i film in programmazione…
          </Text>
        </View>
      ) : catalog.isError ? (
        <CatalogNotice
          title="Programmazione non disponibile"
          message={getCatalogErrorMessage(
            catalog.error,
            "Non è stato possibile caricare i film in sala. Verifica la connessione e riprova.",
          )}
          onRetry={() => void catalog.refetch()}
        />
      ) : visibleMovies.length === 0 ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <Feather name="film" size={22} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>{visibleMovies.map(renderMovie)}</View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 6,
  },
  topCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2.4 },
  title: {
    marginTop: 8,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    fontFamily: "Inter_700Bold",
  },
  description: { maxWidth: 340, fontSize: 13, lineHeight: 20 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  regionPill: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  regionText: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "Inter_600SemiBold",
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  segmentText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  segmentCount: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentCountText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  orderNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 2,
  },
  orderText: { flex: 1, fontSize: 11, lineHeight: 16 },
  list: { gap: 12 },
  statusPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  statusText: { fontSize: 12, lineHeight: 18, textAlign: "center" },
});

