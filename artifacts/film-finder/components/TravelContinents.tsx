import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { GROUP_META } from "@/constants/travelGroups";
import { TRAVEL_COUNTRIES } from "@/constants/travelFilms";
import { useColors } from "@/hooks/useColors";

type TargetInfo = {
  key: string;
  label: string;
  flag: string;
  region: string;
};

const TARGETS: TargetInfo[] = (() => {
  const seen = new Map<string, TargetInfo>();
  for (const country of TRAVEL_COUNTRIES) {
    const key = country.group ?? country.id;
    if (seen.has(key)) continue;
    seen.set(key, {
      key,
      label: country.group ?? country.name,
      flag: country.group
        ? (GROUP_META[country.group]?.flag ?? country.flag)
        : country.flag,
      region: country.region,
    });
  }
  return [...seen.values()];
})();

export const SHORT_REGION: Record<string, string> = {
  "Asia centrale, meridionale e Medio Oriente": "Medio Oriente e Asia centrale",
};

export const CONTINENTS: string[] = [
  "Europa",
  "Nord America",
  "Sud America",
  "Asia orientale",
  "Sud-est asiatico",
  "Asia centrale, meridionale e Medio Oriente",
  "Africa",
  "Oceania",
];

type Props = {
  /** Area selezionata; se null o non specificata, usa Europa come predefinita. */
  region: string | null;
  onRegionChange: (region: string) => void;
  /** Chiave dello stato scelto: nome del gruppo (es. "Italia") o id scheda. */
  onSelectTarget: (key: string) => void;
  /** Mostra tutti i film di tutta la regione (continente). */
  onRegionAll?: (region: string) => void;
};

export function TravelContinents({
  region,
  onRegionChange,
  onSelectTarget,
  onRegionAll,
}: Props) {
  const colors = useColors();
  const currentRegion = region ?? "Europa";

  const regionTargets = useMemo(
    () =>
      TARGETS.filter((target) => target.region === currentRegion).sort((a, b) =>
        a.label.localeCompare(b.label, "it"),
      ),
    [currentRegion],
  );

  const regionLabel = SHORT_REGION[currentRegion] ?? currentRegion;

  return (
    <View style={styles.container}>
      {/* Tasti dei continenti */}
      <View style={styles.continentChips}>
        {CONTINENTS.map((name) => {
          const isActive = currentRegion === name;
          return (
            <Pressable
              key={name}
              testID={`continent-chip-${name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Continente ${SHORT_REGION[name] ?? name}`}
              onPress={() => onRegionChange(name)}
              style={({ pressed }) => [
                styles.continentChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.continentChipText,
                  { color: isActive ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {SHORT_REGION[name] ?? name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Intestazione del continente selezionato con tasto 'Tutti i film' */}
      <View
        style={[
          styles.regionHeader,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.regionInfo}>
          <Text style={[styles.regionName, { color: colors.foreground }]}>
            {regionLabel}
          </Text>
          <Text style={[styles.regionCount, { color: colors.mutedForeground }]}>
            {regionTargets.length} stati e mete
          </Text>
        </View>

        {onRegionAll && (
          <Pressable
            key="continent-all"
            testID={`continent-all-${currentRegion}`}
            accessibilityRole="button"
            accessibilityLabel={`Tutti i film di ${regionLabel}`}
            onPress={() => onRegionAll(currentRegion)}
            style={({ pressed }) => [
              styles.allFilmsButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Feather name="film" size={13} color={colors.primaryForeground} />
            <Text
              style={[
                styles.allFilmsText,
                { color: colors.primaryForeground },
              ]}
            >
              Tutti i film
            </Text>
          </Pressable>
        )}
      </View>

      {/* Tasti dei vari stati */}
      <View style={styles.stateChips}>
        {regionTargets.map((target) => (
          <Pressable
            key={target.key}
            testID={`map-target-${target.key}`}
            accessibilityRole="button"
            accessibilityLabel={`Apri ${target.label}`}
            onPress={() => onSelectTarget(target.key)}
            style={({ pressed }) => [
              styles.stateChip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={styles.stateFlag}>{target.flag}</Text>
            <Text style={[styles.stateText, { color: colors.foreground }]}>
              {target.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  continentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  continentChip: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 17,
  },
  continentChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  regionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 4,
    gap: 10,
  },
  regionInfo: {
    flex: 1,
    gap: 2,
  },
  regionName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  regionCount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  allFilmsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 32,
  },
  allFilmsText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  stateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  stateChip: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  stateFlag: {
    fontSize: 18,
  },
  stateText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
