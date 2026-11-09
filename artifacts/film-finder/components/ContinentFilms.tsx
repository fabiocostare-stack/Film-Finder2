import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TRAVEL_COUNTRIES, type TravelCountry } from "@/constants/travelFilms";
import { GROUP_META } from "@/constants/travelGroups";
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
          {GROUP_META[region]?.flag ?? "🌍"} {region}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Non ci sono film disponibili per questa area.
        </Text>
      </ScrollView>
    );
  }

  // Raggruppa i paesi che hanno un gruppo (es. Italia → zone), gli altri restano singoli.
  const groups = new Map<string, TravelCountry[]>();
  const singles: TravelCountry[] = [];

  for (const country of countries) {
    if (country.group) {
      if (!groups.has(country.group)) groups.set(country.group, []);
      groups.get(country.group)!.push(country);
    } else {
      singles.push(country);
    }
  }

  const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], "it"),
  );

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
      <Text style={[styles.title, { color: colors.foreground }]}>
        {GROUP_META[region]?.flag ?? "🌍"} {region}
      </Text>
      <Text style={[styles.count, { color: colors.primary }]}>
        {totalFilms} film in {countries.length} stato{countries.length !== 1 ? "i" : ""}
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Tutti i film disponibili per gli stati di questa area.
      </Text>

      {sortedGroups.map(([group, areas]) => (
        <View key={group} style={styles.groupBlock}>
          <Text style={[styles.groupTitle, { color: colors.foreground }]}>
            {GROUP_META[group]?.flag ?? "🏳️"} {group}
          </Text>
          {areas.map((country) => (
            <View key={country.id} style={styles.countryCard}>
              <Pressable
                testID={`continent-film-${country.id}`}
                accessibilityRole="button"
                accessibilityLabel={country.name}
                onPress={() => {}}
                style={styles.countryRow}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={[styles.countryName, { color: colors.foreground }]}>
                  {country.name}
                </Text>
              </Pressable>
              <View style={styles.filmsList}>
                {country.films.map((film) => (
                  <Text
                    key={film.title + film.year}
                    style={styles.filmRow}
                  >
                    {film.title} ({film.year})
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}

      {singles.map((country) => (
        <View key={country.id} style={styles.countryCard}>
          <Pressable
            testID={`continent-film-${country.id}`}
            accessibilityRole="button"
            accessibilityLabel={country.name}
            onPress={() => {}}
            style={styles.countryRow}
          >
            <Text style={styles.countryFlag}>{country.flag}</Text>
            <Text style={[styles.countryName, { color: colors.foreground }]}>
              {country.name}
            </Text>
          </Pressable>
          <View style={styles.filmsList}>
            {country.films.map((film) => (
              <Text
                key={film.title + film.year}
                style={styles.filmRow}
              >
                {film.title} ({film.year})
              </Text>
            ))}
          </View>
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
  groupBlock: { gap: 8 },
  groupTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  countryCard: { gap: 4 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  countryFlag: { fontSize: 20 },
  countryName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  filmsList: { gap: 2 },
  filmRow: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingLeft: 36,
  },
});
