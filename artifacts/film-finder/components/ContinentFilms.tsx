import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  resolveMoviesByTitle,
  type Movie,
} from "@workspace/api-client-react";
import { CatalogNotice, getCatalogErrorMessage } from "@/components/CatalogNotice";
import { FilmCard } from "@/components/FilmCard";
import { TRAVEL_COUNTRIES } from "@/constants/travelFilms";
import { usePreferences } from "@/context/PreferencesContext";
import { useMovieCredits } from "@/hooks/useMovieCredits";
import { useColors } from "@/hooks/useColors";

type Props = {
  /** Regione/continente da mostrare (es. "Europa", "Asia orientale"…). */
  region: string;
  onBack: () => void;
};

/** Schermata "Tutti i film": elenca ogni stato del continente con i titoli
 *  dei film disponibili, divisi per gruppo/paese. */
export function ContinentFilms({ region, onBack }: Props) {
  const colors = useColors();
  const {
    preferences,
    toggleWatchedMovie,
    toggleSavedMovie,
  } = usePreferences();

  const countries = TRAVEL_COUNTRIES.filter((c) => c.region === region);

  const totalFilms = countries.reduce((sum, c) => sum + c.films.length, 0);

  if (countries.length === 0) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.emptyContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Indietro"
          onPress={onBack}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>
            Indietro
          </Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          TUTTI I FILM
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {region}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Non ci sono film disponibili per questa area.
        </Text>
      </ScrollView>
    );
  }

  const uniqueMap = new Map<string, { title: string; year: number }>();
  for (const country of countries) {
    for (const film of country.films) {
      const key = `${film.title}|${film.year}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { title: film.title, year: film.year });
      }
    }
  }
  const uniqueList = Array.from(uniqueMap.values());

  const resolved = useQuery({
    queryKey: ["continent-films-v1", region],
    queryFn: () => resolveMoviesByTitle(uniqueList),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: uniqueList.length > 0,
  });

  const movieByKey = new Map<number, Movie>();
  if (resolved.data) {
    resolved.data.forEach((movie: Movie | null, index: number) => {
      if (movie) {
        movieByKey.set(movie.id, movie);
      }
    });
  }

  const resolvedMovieIds = resolved.data
    ? resolved.data.filter((m): m is Movie => Boolean(m)).map((m) => m.id)
    : [];
  const { creditsByMovieId, isFetching } = useMovieCredits(resolvedMovieIds);

  const watchedIds = new Set(
    preferences.watchedMovies.map((m) => String(m.id)),
  );
  const savedIds = new Set(
    preferences.savedMovies.map((m) => String(m.id)),
  );

  if (resolved.isError) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.emptyContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Indietro"
          onPress={onBack}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.primary }]}>
            Indietro
          </Text>
        </Pressable>
        <CatalogNotice
          title="Errore nel caricamento"
          message={getCatalogErrorMessage(resolved.error, "Impossibile caricare i film di questa area.")}
          onRetry={() => resolved.refetch()}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Indietro"
        onPress={onBack}
        style={styles.backButton}
      >
        <Feather name="arrow-left" size={18} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.primary }]}>
          Indietro
        </Text>
      </Pressable>

      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        TUTTI I FILM
      </Text>
      <Text style={[styles.title, { color: colors.primary }]}>{region}</Text>
      <Text style={[styles.count, { color: colors.primary }]}>
        {totalFilms} film in {countries.length} stati
      </Text>

      {countries.map((country) => (
        <View key={country.id} style={styles.countryBlock}>
          <Text style={[styles.countryName, { color: colors.primary }]}>
            {country.flag} {country.name} ({country.films.length})
          </Text>
          {country.films.map((film) => {
            const movie = movieByKey.get(
              Number(
                Array.from(movieByKey.entries()).find(
                  ([, m]) =>
                    m.title === film.title &&
                    m.releaseDate?.slice(0, 4) ===
                      String(film.year),
                )?.[0],
              ),
            );
            if (!movie) return null;
            const credits = creditsByMovieId.get(movie.id);
            return (
              <FilmCard
                key={movie.id}
                movie={movie}
                credits={credits}
                creditsLoading={
                  isFetching && !creditsByMovieId.has(movie.id)
                }
                isWatched={watchedIds.has(String(movie.id))}
                isSaved={savedIds.has(String(movie.id))}
                onToggleWatched={toggleWatchedMovie}
                onToggleSave={toggleSavedMovie}
              />
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    marginTop: 4,
  },
  backText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  eyebrow: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.4,
  },
  title: {
    marginTop: -5,
    fontSize: 32,
    letterSpacing: -1,
    fontFamily: "Inter_700Bold",
  },
  description: {
    marginTop: -9,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 21,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyContent: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  countryBlock: { gap: 6, marginBottom: 12 },
  countryName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  filmRow: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    paddingLeft: 24,
  },
});
