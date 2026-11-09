import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TRAVEL_COUNTRIES } from "@/constants/travelFilms";
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
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Indietro
        </Text>
      </Pressable>

      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        TUTTI I FILM
      </Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{region}</Text>
      <Text style={[styles.count, { color: colors.primary }]}>
        {totalFilms} film in {countries.length} stato{countries.length !== 1 ? "i" : ""}
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Tutti i film disponibili per gli stati di questa area.
      </Text>

      {countries.map((country) => (
        <View key={country.id} style={styles.countryBlock}>
          <Text style={[styles.countryName, { color: colors.foreground }]}>
            {country.flag} {country.name} ({country.films.length})
          </Text>
          {country.films.map((film) => (
            <Text key={film.title + film.year} style={styles.filmRow}>
              {film.title} ({film.year})
            </Text>
          ))}
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
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingLeft: 24,
  },
});
