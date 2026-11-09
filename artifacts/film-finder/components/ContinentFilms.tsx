import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { CatalogNotice, getCatalogErrorMessage } from "@/components/CatalogNotice";
import { FilmCard } from "@/components/FilmCard";
import { TRAVEL_COUNTRIES, type TravelCountry } from "@/constants/travelFilms";
import { usePreferences } from "@/context/PreferencesContext";
import { useColors } from "@/hooks/useColors";
import { useMovieCredits } from "@/hooks/useMovieCredits";
import { getTravelCount, setTravelCount } from "@/lib/travelCounts";
import { countryQueryKey, resolveCountryFilms } from "@/lib/travelResolve";

type Props = {
  /** Area da mostrare (es. "Europa", "Asia orientale"…). */
  region: string;
  onBack: () => void;
};

/** Tutti i film di un'area, divisi per stato. Ogni stato si apre a richiesta
 *  e cerca i suoi film solo in quel momento. */
export function ContinentFilms({ region, onBack }: Props) {
  const colors = useColors();
  const countries = useMemo(
    () => TRAVEL_COUNTRIES.filter((country) => country.region === region),
    [region],
  );
  const totalFilms = countries.reduce(
    (sum, country) => sum + country.films.length,
    0,
  );
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <View style={styles.container}>
      <Pressable
        testID="continent-back"
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

      <Text style={[styles.eyebrow, { color: colors.primary }]}>TUTTI I FILM</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{region}</Text>
      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {totalFilms} film selezionati in {countries.length} schede. Tocca uno
        stato per vederne i film.
      </Text>

      {countries.map((country) => {
        const isOpen = open.has(country.id);
        const known = getTravelCount(country.id);
        return (
          <View key={country.id} style={styles.block}>
            <Pressable
              testID={`continent-toggle-${country.id}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${isOpen ? "Chiudi" : "Apri"} ${country.name}`}
              onPress={() => toggle(country.id)}
              style={({ pressed }) => [
                styles.header,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <View style={styles.headerCopy}>
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {country.group ? `${country.group} · ` : ""}
                  {country.name}
                </Text>
                <Text style={[styles.meta, { color: colors.primary }]}>
                  {known !== undefined
                    ? `${known} film`
                    : `Fino a ${country.films.length} film`}
                </Text>
              </View>
              <Feather
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
            {isOpen ? <CountrySection country={country} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function CountrySection({ country }: { country: TravelCountry }) {
  const colors = useColors();
  const { preferences, toggleWatchedMovie, toggleSavedMovie } = usePreferences();

  const resolved = useQuery({
    queryKey: countryQueryKey(country.id),
    queryFn: () => resolveCountryFilms(country),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (resolved.data) setTravelCount(country.id, resolved.data.found.length);
  }, [country.id, resolved.data]);

  const items = useMemo(() => resolved.data?.found ?? [], [resolved.data]);
  const credits = useMovieCredits(items.map((item) => item.movie.id));
  const watchedIds = useMemo(
    () => new Set(preferences.watchedMovies.map((movie) => movie.id)),
    [preferences.watchedMovies],
  );
  const savedIds = useMemo(
    () => new Set(preferences.savedMovies.map((movie) => movie.id)),
    [preferences.savedMovies],
  );

  if (resolved.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Cerco i film di {country.name}…
        </Text>
      </View>
    );
  }
  if (resolved.isError) {
    return (
      <CatalogNotice
        title="Errore nel caricamento"
        message={getCatalogErrorMessage(
          resolved.error,
          "Impossibile caricare i film di questo stato.",
        )}
        onRetry={() => void resolved.refetch()}
      />
    );
  }

  return (
    <View style={styles.films}>
      {items.length === 0 ? (
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Non ho trovato i film di questo stato su TMDB.
        </Text>
      ) : null}
      {items.map(({ movie }) => (
        <FilmCard
          key={movie.id}
          movie={movie}
          credits={credits.creditsByMovieId.get(movie.id)}
          creditsLoading={
            credits.isFetching && !credits.creditsByMovieId.has(movie.id)
          }
          isWatched={watchedIds.has(movie.id)}
          isSaved={savedIds.has(movie.id)}
          onToggleWatched={toggleWatchedMovie}
          onToggleSave={toggleSavedMovie}
        />
      ))}
      {resolved.data && resolved.data.missing.length > 0 ? (
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Non trovati su TMDB: {resolved.data.missing.join(", ")}.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
  },
  backText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  eyebrow: { marginTop: 6, fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2.4 },
  title: { marginTop: -5, fontSize: 32, letterSpacing: -1, fontFamily: "Inter_700Bold" },
  count: { fontSize: 13, lineHeight: 19 },
  block: { gap: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  flag: { fontSize: 28 },
  headerCopy: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontFamily: "Inter_700Bold" },
  meta: { fontSize: 12, lineHeight: 17 },
  loading: { alignItems: "center", gap: 8, paddingVertical: 16 },
  films: { gap: 14 },
});
