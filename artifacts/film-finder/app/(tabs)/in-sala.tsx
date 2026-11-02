import { useMemo } from "react";
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
import {
  getListMoviesInTheatersQueryKey,
  useListMoviesInTheaters,
  type ListMoviesInTheatersParams,
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

const REGION = "IT";
const STALE_TIME = 30 * 60 * 1000;
const MUST_SEE_MIN_RATING = 6.5;
const MUST_SEE_MIN_VOTES = 30;
const MUST_SEE_LIMIT = 4;
const IN_CINEMAS_LIMIT = 12;
const UPCOMING_LIMIT = 10;
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

  const params: ListMoviesInTheatersParams = { region: REGION };
  const catalog = useListMoviesInTheaters(params, {
    query: {
      queryKey: getListMoviesInTheatersQueryKey(params),
      staleTime: STALE_TIME,
      refetchOnWindowFocus: false,
      retry: false,
    },
  });

  const nowPlaying = catalog.data?.nowPlaying ?? [];
  const upcoming = catalog.data?.upcoming ?? [];

  const mustSee = useMemo(() => {
    const ranked = [...nowPlaying].sort(
      (a, b) => b.voteAverage - a.voteAverage,
    );
    const strong = ranked.filter(
      (movie) =>
        movie.voteAverage >= MUST_SEE_MIN_RATING &&
        (movie.voteCount ?? 0) >= MUST_SEE_MIN_VOTES,
    );
    return (strong.length > 0 ? strong : ranked).slice(0, MUST_SEE_LIMIT);
  }, [nowPlaying]);

  const mustSeeIds = useMemo(
    () => new Set(mustSee.map((movie) => movie.id)),
    [mustSee],
  );
  const inCinemas = useMemo(
    () =>
      nowPlaying
        .filter((movie) => !mustSeeIds.has(movie.id))
        .slice(0, IN_CINEMAS_LIMIT),
    [mustSeeIds, nowPlaying],
  );
  const nextReleases = useMemo(
    () => upcoming.slice(0, UPCOMING_LIMIT),
    [upcoming],
  );

  const visibleIds = useMemo(
    () =>
      [...mustSee, ...inCinemas, ...nextReleases].map((movie) => movie.id),
    [inCinemas, mustSee, nextReleases],
  );
  const movieCredits = useMovieCredits(visibleIds);
  const watchedIds = useMemo(
    () => new Set(preferences.watchedMovies.map((movie) => movie.id)),
    [preferences.watchedMovies],
  );
  const savedIds = useMemo(
    () => new Set(preferences.savedMovies.map((movie) => movie.id)),
    [preferences.savedMovies],
  );

  const renderCard = (movie: Movie) => (
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
      releaseLabel={formatReleaseLabel(movie.releaseDate)}
    />
  );

  const isEmpty = !catalog.isLoading && nowPlaying.length === 0 && upcoming.length === 0;

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
        Cosa c'è in programmazione nelle sale italiane e cosa sta per uscire.
        Aggiungi alla lista quello che ti interessa.
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
      ) : isEmpty ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <Feather name="film" size={22} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Nessun film in programmazione trovato per le sale italiane in questo
            momento.
          </Text>
        </View>
      ) : (
        <>
          {mustSee.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle
                icon="award"
                title="Da non perdere"
                subtitle="I più apprezzati tra quelli in sala"
              />
              <View style={styles.list}>{mustSee.map(renderCard)}</View>
            </View>
          ) : null}

          {inCinemas.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle
                icon="film"
                title="Al cinema ora"
                subtitle="In programmazione nelle sale italiane"
              />
              <View style={styles.list}>{inCinemas.map(renderCard)}</View>
            </View>
          ) : null}

          {nextReleases.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle
                icon="calendar"
                title="Prossimamente"
                subtitle="Le prossime uscite, dalla più vicina"
              />
              <View style={styles.list}>{nextReleases.map(renderCard)}</View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: "award" | "film" | "calendar";
  title: string;
  subtitle: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text
          style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
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
  regionText: { fontSize: 10, letterSpacing: 1.4, fontFamily: "Inter_600SemiBold" },
  refreshButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { gap: 11 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCopy: { flex: 1, gap: 2 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 11, lineHeight: 16 },
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

