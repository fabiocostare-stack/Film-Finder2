import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  loadMoviesAvailableInRegion,
  loadMoviesOnProviders,
  resolveMoviesByTitle,
  type Movie,
} from "@workspace/api-client-react";
import {
  CatalogNotice,
  getCatalogErrorMessage,
} from "@/components/CatalogNotice";
import { FilmCard } from "@/components/FilmCard";
import {
  type TravelCountry,
  type TravelFilm,
} from "@/constants/travelFilms";
import { usePreferences } from "@/context/PreferencesContext";
import { useColors } from "@/hooks/useColors";
import { useMovieCredits } from "@/hooks/useMovieCredits";
import { setTravelCount } from "@/lib/travelCounts";

type CountryFilmsProps = {
  country: TravelCountry;
  onBack: () => void;
};

const KIND_LABEL: Record<TravelFilm["kind"], string> = {
  film: "Film",
  docufilm: "Docu-film",
  biopic: "Biopic",
};

const VIEW_LABEL: Record<TravelFilm["view"], string> = {
  locale: "Sguardo locale",
  esterno: "Sguardo da fuori",
};

type ResolvedFilm = { film: TravelFilm; movie: Movie };

export function CountryFilms({ country, onBack }: CountryFilmsProps) {
  const colors = useColors();
  const { preferences, toggleWatchedMovie, toggleSavedMovie } =
    usePreferences();
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const resolved = useQuery({
    queryKey: ["travel-country-v2", country.id],
    queryFn: async (): Promise<ResolvedFilm[]> => {
      const movies = await resolveMoviesByTitle(
        country.films.map((film) => ({ title: film.title, year: film.year })),
      );
      const found: ResolvedFilm[] = [];
      country.films.forEach((film, index) => {
        const movie = movies[index];
        if (movie) found.push({ film, movie });
      });
      // Tieni solo i film che si trovano da qualche parte in Italia
      // (streaming, gratis, noleggio o acquisto).
      const inItaly = new Set(
        await loadMoviesAvailableInRegion(found.map((item) => item.movie.id)),
      );
      return found.filter((item) => inItaly.has(item.movie.id));
    },
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const allItems = useMemo(() => resolved.data ?? [], [resolved.data]);
  useEffect(() => {
    if (resolved.data) setTravelCount(country.id, resolved.data.length);
  }, [country.id, resolved.data]);
  const providerIds = useMemo(
    () => preferences.selectedProviders.map((provider) => provider.id),
    [preferences.selectedProviders],
  );
  const availability = useQuery({
    queryKey: [
      "travel-availability-v1",
      country.id,
      providerIds.join(","),
      allItems.length,
    ],
    queryFn: () =>
      loadMoviesOnProviders(
        allItems.map((item) => item.movie.id),
        providerIds,
      ),
    enabled: onlyAvailable && allItems.length > 0 && providerIds.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const items = useMemo(() => {
    if (!onlyAvailable) return allItems;
    const ids = new Set(availability.data ?? []);
    return allItems.filter((item) => ids.has(item.movie.id));
  }, [allItems, availability.data, onlyAvailable]);

  const movieCredits = useMovieCredits(items.map((item) => item.movie.id));
  const watchedIds = useMemo(
    () => new Set(preferences.watchedMovies.map((movie) => movie.id)),
    [preferences.watchedMovies],
  );
  const savedIds = useMemo(
    () => new Set(preferences.savedMovies.map((movie) => movie.id)),
    [preferences.savedMovies],
  );

  return (
    <View style={styles.container}>
      <Pressable
        testID="travel-back"
        accessibilityRole="button"
        accessibilityLabel="Torna alla lista dei paesi"
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
        <Text style={styles.flag}>{country.flag}</Text>
        <View style={styles.headerCopy}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {country.name}
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            {country.tagline}
          </Text>
          {resolved.data ? (
            <Text style={[styles.tagline, { color: colors.primary }]}>
              {resolved.data.length === country.films.length
                ? `${resolved.data.length} film disponibili in Italia`
                : `${resolved.data.length} film disponibili in Italia su ${country.films.length} selezionati`}
            </Text>
          ) : null}
        </View>
      </View>

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

      {resolved.isLoading ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Preparo il viaggio in {country.name}…
          </Text>
        </View>
      ) : resolved.isError ? (
        <CatalogNotice
          title="Film non disponibili"
          message={getCatalogErrorMessage(
            resolved.error,
            "Non è stato possibile caricare i film di questo paese. Riprova.",
          )}
          onRetry={() => void resolved.refetch()}
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
      ) : items.length === 0 ? (
        <View style={[styles.statusPanel, { borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {onlyAvailable
              ? "Nessun film di questo paese è sui tuoi servizi. Disattiva il filtro per vederli tutti."
              : "Non ho trovato i film di questo paese."}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map(({ film, movie }) => (
            <View key={movie.id} style={styles.entry}>
              <View style={styles.noteRow}>
                <Feather name="map-pin" size={13} color={colors.primary} />
                <Text style={[styles.note, { color: colors.foreground }]}>
                  {film.note}
                </Text>
              </View>
              <Text style={[styles.tags, { color: colors.mutedForeground }]}>
                {KIND_LABEL[film.kind]} · {VIEW_LABEL[film.view]}
              </Text>
              <FilmCard
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
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  backText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  flag: { fontSize: 44 },
  headerCopy: { flex: 1, gap: 4 },
  name: { fontSize: 26, lineHeight: 31, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 13, lineHeight: 18 },
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
  list: { gap: 18 },
  entry: { gap: 6 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  note: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: "Inter_600SemiBold" },
  tags: { fontSize: 11, marginLeft: 20, marginBottom: 2 },
  statusPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  statusText: { fontSize: 12, textAlign: "center" },
});
