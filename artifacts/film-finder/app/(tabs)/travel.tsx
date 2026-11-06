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
import { CountryFilms } from "@/components/CountryFilms";
import {
  TRAVEL_COUNTRIES,
  type TravelCountry,
} from "@/constants/travelFilms";

const REGIONS = [...new Set(TRAVEL_COUNTRIES.map((country) => country.region))];
import { useColors } from "@/hooks/useColors";

export default function TravelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<TravelCountry | null>(null);

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
      {selected ? (
        <CountryFilms country={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            VIAGGIA CON UN FILM
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Viaggi
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Film scelti per farti sentire la vita di un paese: strade, case,
            paesaggi e persone.
          </Text>
          {REGIONS.map((region) => (
            <View key={region} style={styles.section}>
              <Text style={[styles.regionTitle, { color: colors.foreground }]}>
                {region}
              </Text>
          <View style={styles.list}>
            {TRAVEL_COUNTRIES.filter((country) => country.region === region).map((country) => (
              <Pressable
                key={country.id}
                testID={`open-country-${country.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Apri ${country.name}`}
                onPress={() => setSelected(country)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={styles.flag}>{country.flag}</Text>
                <View style={styles.cardCopy}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>
                    {country.name}
                  </Text>
                  <Text
                    style={[styles.cardTagline, { color: colors.mutedForeground }]}
                  >
                    {country.tagline}
                  </Text>
                  <Text style={[styles.cardCount, { color: colors.primary }]}>
                    Selezione di {country.films.length} film
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            ))}
          </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 15 },
  eyebrow: { marginTop: 6, fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2.4 },
  title: { marginTop: -5, fontSize: 32, letterSpacing: -1, fontFamily: "Inter_700Bold" },
  description: { marginTop: -9, marginBottom: 6, fontSize: 14, lineHeight: 21 },
  section: { gap: 10, marginTop: 6 },
  regionTitle: { fontSize: 19, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  flag: { fontSize: 36 },
  cardCopy: { flex: 1, gap: 3 },
  cardName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  cardTagline: { fontSize: 12, lineHeight: 17 },
  cardCount: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
