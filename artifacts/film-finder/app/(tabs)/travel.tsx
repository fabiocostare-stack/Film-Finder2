import { useEffect, useMemo, useRef, useState } from "react";
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
import { TravelMap } from "@/components/TravelMap";
import {
  TRAVEL_COUNTRIES,
  type TravelCountry,
} from "@/constants/travelFilms";
import { GROUP_META } from "@/constants/travelGroups";
import { useColors } from "@/hooks/useColors";
import { getTravelCount } from "@/lib/travelCounts";

const REGIONS: string[] = [
  ...new Set(TRAVEL_COUNTRIES.map((country) => country.region)),
];

type Block = { group: string | null; countries: TravelCountry[] };

/** Divide le schede di un'area in blocchi: i paesi con più schede (Italia,
 *  Spagna, Stati Uniti…) formano un unico blocco, che si apre in una pagina
 *  con le varie zone. In Europa l'elenco è in ordine alfabetico. */
function buildBlocks(region: string): Block[] {
  const blocks: Block[] = [];
  const byGroup = new Map<string, Block>();
  for (const country of TRAVEL_COUNTRIES) {
    if (country.region !== region) continue;
    if (country.group) {
      let block = byGroup.get(country.group);
      if (!block) {
        block = { group: country.group, countries: [] };
        byGroup.set(country.group, block);
        blocks.push(block);
      }
      block.countries.push(country);
    } else {
      blocks.push({ group: null, countries: [country] });
    }
  }
  if (region === "Europa") {
    const label = (block: Block) => block.group ?? block.countries[0]!.name;
    blocks.sort((x, y) => label(x).localeCompare(label(y), "it"));
  }
  return blocks;
}

const regionKey = (region: string) => `r:${region}`;

export default function TravelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<TravelCountry | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const savedY = useRef(0);
  const savedGroupY = useRef(0);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mode, setMode] = useState<"map" | "list">("map");
  const [mapRegion, setMapRegion] = useState<string | null>(null);

  const blocksByRegion = useMemo(
    () => new Map(REGIONS.map((region) => [region, buildBlocks(region)])),
    [],
  );

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allRegionsCollapsed = REGIONS.every((region) =>
    collapsed.has(regionKey(region)),
  );
  const toggleAllRegions = () =>
    setCollapsed(
      allRegionsCollapsed
        ? new Set()
        : new Set(REGIONS.map((region) => regionKey(region))),
    );

  const openCountry = (country: TravelCountry) => {
    if (openGroup) savedGroupY.current = scrollY.current;
    else savedY.current = scrollY.current;
    setSelected(country);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openGroupPage = (group: string) => {
    savedY.current = scrollY.current;
    setOpenGroup(group);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // Tornando indietro, riporta la vista al punto in cui eri
  useEffect(() => {
    if (selected !== null) return;
    const y = openGroup ? savedGroupY.current : savedY.current;
    if (y <= 0) return;
    const timers = [0, 60, 200].map((delay) =>
      setTimeout(
        () => scrollRef.current?.scrollTo({ y, animated: false }),
        delay,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [selected, openGroup]);

  const renderCard = (country: TravelCountry) => {
    const known = getTravelCount(country.id);
    return (
      <Pressable
        key={country.id}
        testID={`open-country-${country.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Apri ${country.name}`}
        onPress={() => openCountry(country)}
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
          <Text style={[styles.cardTagline, { color: colors.mutedForeground }]}>
            {country.tagline}
          </Text>
          <Text style={[styles.cardCount, { color: colors.primary }]}>
            {known !== undefined
              ? `${known} film`
              : `Fino a ${country.films.length} film`}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>
    );
  };

  const selectFromMap = (key: string) => {
    if (GROUP_META[key]) {
      openGroupPage(key);
      return;
    }
    const country = TRAVEL_COUNTRIES.find((item) => item.id === key);
    if (country) openCountry(country);
  };

  const renderGroupCard = (group: string, areas: TravelCountry[]) => {
    const meta = GROUP_META[group] ?? { flag: "🌍", tagline: "" };
    return (
      <Pressable
        key={`group-${group}`}
        testID={`open-group-${group}`}
        accessibilityRole="button"
        accessibilityLabel={`Apri ${group}`}
        onPress={() => openGroupPage(group)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Text style={styles.flag}>{meta.flag}</Text>
        <View style={styles.cardCopy}>
          <Text style={[styles.cardName, { color: colors.foreground }]}>
            {group}
          </Text>
          <Text style={[styles.cardTagline, { color: colors.mutedForeground }]}>
            {meta.tagline}
          </Text>
          <Text style={[styles.cardCount, { color: colors.primary }]}>
            {areas.length} zone
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>
    );
  };

  const groupAreas = openGroup
    ? TRAVEL_COUNTRIES.filter((country) => country.group === openGroup)
    : [];

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
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
      ) : openGroup ? (
        <>
          <Pressable
            testID="travel-group-back"
            accessibilityRole="button"
            accessibilityLabel="Indietro"
            onPress={() => {
              setOpenGroup(null);
            }}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>
              Indietro
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {GROUP_META[openGroup]?.flag} {openGroup}
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {GROUP_META[openGroup]?.tagline}
          </Text>
          <View style={styles.list}>{groupAreas.map(renderCard)}</View>
        </>
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

          <View style={styles.modeBar}>
            {(["map", "list"] as const).map((item) => (
              <Pressable
                key={item}
                testID={`travel-mode-${item}`}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === item }}
                onPress={() => setMode(item)}
                style={({ pressed }) => [
                  styles.modeButton,
                  {
                    backgroundColor: mode === item ? colors.primary : "transparent",
                    borderColor: mode === item ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name={item === "map" ? "globe" : "list"}
                  size={14}
                  color={mode === item ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.toggleAllText,
                    { color: mode === item ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {item === "map" ? "Mappa" : "Elenco"}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === "map" ? (
            <TravelMap
              region={mapRegion}
              onRegionChange={setMapRegion}
              onSelectTarget={selectFromMap}
            />
          ) : (
            <>
          <Pressable
            testID="travel-toggle-regions"
            accessibilityRole="button"
            accessibilityLabel={
              allRegionsCollapsed
                ? "Espandi tutte le aree"
                : "Comprimi tutte le aree"
            }
            onPress={toggleAllRegions}
            style={({ pressed }) => [
              styles.toggleAll,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather
              name={allRegionsCollapsed ? "chevrons-down" : "chevrons-up"}
              size={14}
              color={colors.mutedForeground}
            />
            <Text style={[styles.toggleAllText, { color: colors.foreground }]}>
              {allRegionsCollapsed ? "Espandi tutto" : "Comprimi tutto"}
            </Text>
          </Pressable>

          {REGIONS.map((region) => {
            const blocks = blocksByRegion.get(region) ?? [];
            const total = blocks.length;
            const regionClosed = collapsed.has(regionKey(region));
            return (
              <View key={region} style={styles.section}>
                <Pressable
                  testID={`toggle-region-${region}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !regionClosed }}
                  accessibilityLabel={`${regionClosed ? "Espandi" : "Comprimi"} ${region}`}
                  onPress={() => toggle(regionKey(region))}
                  style={({ pressed }) => [
                    styles.regionHeader,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather
                    name={regionClosed ? "chevron-right" : "chevron-down"}
                    size={20}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[styles.regionTitle, { color: colors.foreground }]}
                  >
                    {region}
                  </Text>
                  <Text
                    style={[styles.regionCount, { color: colors.mutedForeground }]}
                  >
                    {total}
                  </Text>
                </Pressable>

                {regionClosed ? null : (
                  <View style={styles.list}>
                    {blocks.map((block) =>
                      block.group
                        ? renderGroupCard(block.group, block.countries)
                        : renderCard(block.countries[0]!),
                    )}
                  </View>
                )}
              </View>
            );
          })}
            </>
          )}
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
  toggleAll: {
    alignSelf: "flex-start",
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  modeBar: { flexDirection: "row", gap: 8 },
  modeButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 17,
  },
  toggleAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  section: { gap: 10, marginTop: 6 },
  regionHeader: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  regionTitle: { flex: 1, fontSize: 19, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  regionCount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  blocks: { gap: 12 },
  group: { gap: 10 },
  groupHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  groupTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold" },
  list: { gap: 10 },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
  backText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
