import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  loadDirectorFilmography,
  loadMoviesOnProviders,
  type DirectorProfile,
} from "@workspace/api-client-react";
import {
  CatalogNotice,
  getCatalogErrorMessage,
} from "@/components/CatalogNotice";
import { FilmCard } from "@/components/FilmCard";
import { usePreferences } from "@/context/PreferencesContext";
import { useColors } from "@/hooks/useColors";
import { useMovieCredits } from "@/hooks/useMovieCredits";

type SortMode = "recent" | "oldest" | "rating";

const SORT_OPTIONS: Array<{ mode: SortMode; label: string }> = [
  { mode: "recent", label: "Più recenti" },
  { mode: "oldest", label: "Più vecchi" },
  { mode: "rating", label: "Voto" },
];

type DirectorDetailProps = {
  director: DirectorProfile;
  onBack: () => void;
};

export function DirectorDetail({ director, onBack }: DirectorDetailProps) {
  const colors = useColors();
  const directorId = director.id;
  const {
    preferences,
    toggleWatchedMovie,
    toggleSavedMovie,
  } = usePreferences();

  const filmography = useQuery({
    queryKey: ["director-filmography-v2", directorId],
    queryFn: () => loadDirectorFilmography(directorId),
    staleTime: 12 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [bioExpanded, setBioExpanded] = useState(false);

  const allMovies = filmography.data?.movies ?? [];
  const signatureMovie = filmography.data?.signatureMovie ?? null;

  const providerIds = useMemo(
    () => preferences.selectedProviders.map((provider) => provider.id),
    [preferences.selectedProviders],
  );
  const availability = useQuery({
    queryKey: [
      "director-availability",
      directorId,
      providerIds.join(","),
      allMovies.length,
    ],
    queryFn: () =>
      loadMoviesOnProviders(
        allMovies.map((movie) => movie.id),
        providerIds,
      ),
    enabled: onlyAvailable && allMovies.length > 0 && providerIds.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const movies = useMemo(() => {
    let list = allMovies;
    if (onlyAvailable) {
      const ids = new Set(availability.data ?? []);
      list = list.filter((movie) => ids.has(movie.id));
    }
    const sorted = [...list];
    if (sortMode === "recent") {
      sorted.sort((a, b) =>
        (b.releaseDate || "0000").localeCompare(a.releaseDate || "0000"),
      );
    } else if (sortMode === "oldest") {
      sorted.sort((a, b) =>
        (a.releaseDate || "9999").localeCompare(b.releaseDate || "9999"),
      );
    } else {
      sorted.sort((a, b) => b.voteAverage - a.voteAverage);
    }
    return sorted;
  }, [allMovies, availability.data, onlyAvailable, sortMode]);

  const creditMovieIds = useMemo(() => {
    const ids = movies.map((movie) => movie.id);
    if (signatureMovie && !ids.includes(signatureMovie.id)) {
      return [signatureMovie.id, ...ids];
    }
    return ids;
  }, [movies, signatureMovie]);

  const movieCredits = useMovieCredits(creditMovieIds);
  const watchedMovieIds = useMemo(
    () => new Set(preferences.watchedMovies.map((movie) => movie.id)),
    [preferences.watchedMovies],
  );
  const savedMovieIds = useMemo(
    () => new Set(preferences.savedMovies.map((movie) => movie.id)),
    [preferences.savedMovies],
  );

  const watchedCount = useMemo(
    () => allMovies.filter((movie) => watchedMovieIds.has(movie.id)).length,
    [allMovies, watchedMovieIds],
  );
  const progressPercent =
    allMovies.length > 0
      ? Math.round((watchedCount / allMovies.length) * 100)
      : 0;

  const name = filmography.data?.director.name ?? director.name ?? "Regista";
  const profilePath =
    filmography.data?.director.profilePath ?? director.profilePath ?? null;
  const profileUri = profilePath
    ? `https://image.tmdb.org/t/p/w185${profilePath}`
    : null;

  const averageRating = filmography.data?.director.averageRating ?? null;
  const placeOfBirth = filmography.data?.director.placeOfBirth ?? null;
  const birthYear = filmography.data?.director.birthday?.slice(0, 4) ?? null;
  const deathYear = filmography.data?.director.deathday?.slice(0, 4) ?? null;
  const lifespanLabel = birthYear
    ? deathYear
      ? `${birthYear} – ${deathYear}`
      : `Classe ${birthYear}`
    : null;
  const biography = filmography.data?.director.biography ?? null;
  const hasLongBio = Boolean(biography && biography.length > 180);

  return (
    <View style={styles.content}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Torna alla lista dei registi"
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Feather name="arrow-left" size={16} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Indietro
        </Text>
      </Pressable>

      <View style={styles.header}>
        {profileUri ? (
          <Image
            source={{ uri: profileUri }}
            style={[styles.portrait, { backgroundColor: colors.secondary }]}
            resizeMode="cover"
            accessibilityLabel={`Foto di ${name}`}
          />
        ) : (
          <View
            style={[
              styles.portrait,
              styles.portraitFallback,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="user" size={30} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.headerCopy}>
          <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
          <View style={styles.statsBadges}>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {filmography.data
                ? `${allMovies.length} ${allMovies.length === 1 ? "film diretto" : "film diretti"}`
                : "Regista"}
            </Text>
            {averageRating ? (
              <View
                style={[
                  styles.ratingPill,
                  { backgroundColor: colors.accent, borderColor: colors.border },
                ]}
              >
                <Feather name="star" size={11} color={colors.primary} />
                <Text
                  style={[styles.ratingPillText, { color: colors.foreground }]}
                >
                  {averageRating.toFixed(1)} media voto
                </Text>
              </View>
            ) : null}
          </View>
          {placeOfBirth || lifespanLabel ? (
            <View style={styles.metaInfoList}>
              {placeOfBirth ? (
                <View style={styles.metaInfoRow}>
                  <Feather
                    name="map-pin"
                    size={11}
                    color={colors.mutedForeground}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.metaInfoText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {placeOfBirth}
                  </Text>
                </View>
              ) : null}
              {lifespanLabel ? (
                <View style={styles.metaInfoRow}>
                  <Feather
                    name="calendar"
                    size={11}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.metaInfoText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {lifespanLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {biography ? (
        <View
          style={[
            styles.bioBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            numberOfLines={bioExpanded ? undefined : 3}
            style={[styles.bioText, { color: colors.mutedForeground }]}
          >
            {biography}
          </Text>
          {hasLongBio ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setBioExpanded((prev) => !prev)}
              style={({ pressed }) => [
                styles.bioToggle,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text style={[styles.bioToggleText, { color: colors.primary }]}>
                {bioExpanded ? "Mostra meno" : "Leggi tutto"}
              </Text>
              <Feather
                name={bioExpanded ? "chevron-up" : "chevron-down"}
                size={13}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {allMovies.length > 0 ? (
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text
                style={[styles.progressTitle, { color: colors.foreground }]}
              >
                Filmografia completata
              </Text>
            </View>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {watchedCount}/{allMovies.length} visti ({progressPercent}%)
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.secondary },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, progressPercent)}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      {signatureMovie ? (
        <View
          style={[
            styles.signatureSection,
            { backgroundColor: colors.accent, borderColor: colors.border },
          ]}
        >
          <View style={styles.signatureHeader}>
            <Feather name="award" size={15} color={colors.primary} />
            <View style={styles.signatureCopy}>
              <Text style={[styles.signatureEyebrow, { color: colors.primary }]}>
                DA DOVE INIZIARE
              </Text>
              <Text
                style={[styles.signatureTitle, { color: colors.foreground }]}
              >
                Il film simbolo di {name}
              </Text>
            </View>
          </View>
          <FilmCard
            movie={signatureMovie}
            credits={movieCredits.creditsByMovieId.get(signatureMovie.id)}
            creditsLoading={
              movieCredits.isFetching &&
              !movieCredits.creditsByMovieId.has(signatureMovie.id)
            }
            isWatched={watchedMovieIds.has(signatureMovie.id)}
            isSaved={savedMovieIds.has(signatureMovie.id)}
            onToggleWatched={toggleWatchedMovie}
            onToggleSave={toggleSavedMovie}
            badge="Film simbolo"
          />
        </View>
      ) : null}

      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Tutti i suoi film, anche quelli che non sono sui tuoi servizi. Tocca
        l'icona della TV per vedere dove guardarli.
      </Text>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: onlyAvailable }}
          accessibilityLabel="Mostra solo i film disponibili sulle mie piattaforme"
          onPress={() => setOnlyAvailable((value) => !value)}
          style={({ pressed }) => [
            styles.chip,
            {
              borderColor: onlyAvailable ? colors.primary : colors.border,
              backgroundColor: onlyAvailable ? colors.accent : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name={onlyAvailable ? "check-circle" : "circle"}
            size={14}
            color={onlyAvailable ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.chipText,
              { color: onlyAvailable ? colors.primary : colors.foreground },
            ]}
          >
            Disponibili per me
          </Text>
        </Pressable>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(({ mode, label }) => {
            const active = sortMode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSortMode(mode)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.accent : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {filmography.isLoading ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Carico i film di {name}…
          </Text>
        </View>
      ) : filmography.isError ? (
        <CatalogNotice
          title="Film non disponibili"
          message={getCatalogErrorMessage(
            filmography.error,
            "Non è stato possibile caricare i film del regista. Verifica la connessione e riprova.",
          )}
          onRetry={() => void filmography.refetch()}
        />
      ) : onlyAvailable && availability.isLoading ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Controllo quali film sono sui tuoi servizi…
          </Text>
        </View>
      ) : onlyAvailable && availability.isError ? (
        <CatalogNotice
          title="Disponibilità non verificabile"
          message="Non è stato possibile controllare le piattaforme. Riprova tra poco."
          onRetry={() => void availability.refetch()}
        />
      ) : movies.length === 0 ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {onlyAvailable
              ? "Nessun film di questo regista è sui tuoi servizi. Disattiva il filtro per vederli tutti."
              : "Non risultano film diretti da questo regista."}
          </Text>
        </View>
      ) : (
        <View style={styles.movieList}>
          {movies.map((movie) => (
            <FilmCard
              key={movie.id}
              movie={movie}
              credits={movieCredits.creditsByMovieId.get(movie.id)}
              creditsLoading={
                movieCredits.isFetching &&
                !movieCredits.creditsByMovieId.has(movie.id)
              }
              isWatched={watchedMovieIds.has(movie.id)}
              isSaved={savedMovieIds.has(movie.id)}
              onToggleWatched={toggleWatchedMovie}
              onToggleSave={toggleSavedMovie}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 38,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  portrait: { width: 78, height: 94, borderRadius: 16 },
  portraitFallback: { alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, gap: 6 },
  name: { fontSize: 22, lineHeight: 27, fontFamily: "Inter_700Bold" },
  statsBadges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  subtitle: { fontSize: 12 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratingPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  metaInfoList: {
    gap: 3,
    marginTop: 2,
  },
  metaInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaInfoText: {
    flex: 1,
    fontSize: 11,
  },
  bioBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  bioText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bioToggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bioToggleText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 9,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  progressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  progressCount: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  signatureSection: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  signatureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  signatureCopy: {
    flex: 1,
    gap: 1,
  },
  signatureEyebrow: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  signatureTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  hint: { fontSize: 11, lineHeight: 16 },
  controls: { gap: 10 },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    alignSelf: "flex-start",
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  movieList: { gap: 12 },
  statusPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  statusText: { fontSize: 12, textAlign: "center" },
});
