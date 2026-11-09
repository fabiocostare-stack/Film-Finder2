import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle, Path } from "react-native-svg";
import { GROUP_META } from "@/constants/travelGroups";
import { TRAVEL_COUNTRIES } from "@/constants/travelFilms";
import { useColors } from "@/hooks/useColors";
import {
  MANUAL_POINTS,
  REGION_BOXES,
  WORLD_VIEW,
  boxToView,
  loadWorldMap,
  projectPoint,
} from "@/lib/worldMap";

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

const SHORT_REGION: Record<string, string> = {
  "Asia centrale, meridionale e Medio Oriente": "Medio Oriente e Asia centrale",
};

export const MAP_REGIONS = Object.keys(REGION_BOXES);

type Props = {
  /** Area ingrandita; null = mappamondo intero. */
  region: string | null;
  onRegionChange: (region: string | null) => void;
  /** Chiave dello stato scelto: nome del gruppo (es. "Italia") o id scheda. */
  onSelectTarget: (key: string) => void;
  /** Mostra tutti i film di tutta la regione (continente). */
  onRegionAll?: (region: string) => void;
};

export function TravelMap({
  region,
  onRegionChange,
  onSelectTarget,
  onRegionAll,
}: Props) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const map = useQuery({
    queryKey: ["world-map-v1"],
    queryFn: loadWorldMap,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [region]);

  const base = useMemo(() => {
    if (!region) return WORLD_VIEW;
    const box = REGION_BOXES[region];
    return box ? boxToView(...box) : WORLD_VIEW;
  }, [region]);

  const view = useMemo(() => {
    const w = base.w / zoom;
    const h = base.h / zoom;
    return {
      x: base.x + (base.w - w) / 2 + pan.x,
      y: base.y + (base.h - h) / 2 + pan.y,
      w,
      h,
    };
  }, [base, zoom, pan]);

  const targetByKey = useMemo(
    () => new Map(TARGETS.map((target) => [target.key, target])),
    [],
  );

  const pressTarget = (key: string) => {
    const info = targetByKey.get(key);
    if (!info) return;
    if (region === null) onRegionChange(info.region);
    else onSelectTarget(key);
  };

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);
  const height = width > 0 ? (width * view.h) / view.w : 0;
  const unitsPerPx = width > 0 ? view.w / width : 1;

  const markers = useMemo(() => {
    if (!region || !map.data) return [];
    const result: Array<{ key: string; x: number; y: number }> = [];
    for (const info of TARGETS) {
      if (info.region !== region) continue;
      const manual = MANUAL_POINTS[info.key];
      if (manual) {
        const [x, y] = projectPoint(manual[0], manual[1]);
        result.push({ key: info.key, x, y });
        continue;
      }
      const shape = map.data.targets[info.key];
      if (shape?.small) result.push({ key: info.key, x: shape.cx, y: shape.cy });
    }
    return result;
  }, [region, map.data]);

  const regionTargets = useMemo(
    () =>
      TARGETS.filter((target) => target.region === region).sort((a, b) =>
        a.label.localeCompare(b.label, "it"),
      ),
    [region],
  );

  const step = (dx: number, dy: number) =>
    setPan((current) => ({
      x: current.x + dx * view.w * 0.25,
      y: current.y + dy * view.h * 0.25,
    }));

  const changeZoom = (factor: number) =>
    setZoom((current) => Math.min(6, Math.max(1, current * factor)));

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        <Chip
          label="Mondo"
          active={region === null}
          onPress={() => onRegionChange(null)}
        />
        {MAP_REGIONS.map((name) => (
          <Chip
            key={name}
            label={SHORT_REGION[name] ?? name}
            active={region === name}
            onPress={() => onRegionChange(name)}
          />
        ))}
      </View>

      <View
        onLayout={onLayout}
        style={[
          styles.mapBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {map.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Carico la mappa…
            </Text>
          </View>
        ) : map.isError || !map.data ? (
          <View style={styles.center}>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Non riesco a scaricare la mappa (serve la connessione). Puoi usare
              l'elenco.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void map.refetch()}
              style={[styles.retry, { borderColor: colors.border }]}
            >
              <Text style={[styles.retryText, { color: colors.foreground }]}>
                Riprova
              </Text>
            </Pressable>
          </View>
        ) : width > 0 ? (
          <Svg
            width={width}
            height={height}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          >
            <Path d={map.data.other} fill={colors.muted} fillRule="evenodd" />
            {TARGETS.map((info) => {
              const shape = map.data!.targets[info.key];
              if (!shape) return null;
              const dimmed = region !== null && info.region !== region;
              return (
                <Path
                  key={info.key}
                  d={shape.d}
                  fill={colors.primary}
                  fillOpacity={dimmed ? 0.3 : 0.78}
                  fillRule="evenodd"
                  stroke={colors.card}
                  strokeWidth={0.5 * unitsPerPx}
                  onPress={() => pressTarget(info.key)}
                />
              );
            })}
            {markers.map((marker) => (
              <Circle
                key={`m-${marker.key}`}
                cx={marker.x}
                cy={marker.y}
                r={9 * unitsPerPx}
                fill={colors.primary}
                stroke={colors.foreground}
                strokeWidth={1.5 * unitsPerPx}
                onPress={() => pressTarget(marker.key)}
              />
            ))}
          </Svg>
        ) : null}

        {region !== null && map.data ? (
          <View style={styles.zoomBar}>
            <RoundButton icon="plus" label="Ingrandisci" onPress={() => changeZoom(1.5)} />
            <RoundButton icon="minus" label="Riduci" onPress={() => changeZoom(1 / 1.5)} />
            {zoom > 1 ? (
              <>
                <RoundButton icon="arrow-left" label="Sposta a sinistra" onPress={() => step(-1, 0)} />
                <RoundButton icon="arrow-right" label="Sposta a destra" onPress={() => step(1, 0)} />
                <RoundButton icon="arrow-up" label="Sposta in alto" onPress={() => step(0, -1)} />
                <RoundButton icon="arrow-down" label="Sposta in basso" onPress={() => step(0, 1)} />
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {region === null ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Tocca un continente per ingrandirlo, poi scegli lo stato.
        </Text>
      ) : (
        <>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Tocca uno stato sulla mappa o scegli dall'elenco qui sotto.
          </Text>
          <View style={styles.chips}>
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
                    opacity: pressed ? 0.7 : 1,
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
          {onRegionAll && (
            <Pressable
              key="continent-all"
              testID={`continent-all-${region}`}
              accessibilityRole="button"
              accessibilityLabel={`Tutti i film di ${SHORT_REGION[region] ?? region}`}
              onPress={() => onRegionAll(region)}
              style={({ pressed }) => [
                styles.stateChip,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={styles.stateFlag}>🎬</Text>
              <Text style={[styles.stateText, { color: colors.primaryForeground }]}>
                Tutti i film di {SHORT_REGION[region] ?? region}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : "transparent",
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 0.95,
        },
      ]}
    >
      <Feather name={icon} size={16} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  mapBox: {
    width: "100%",
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  center: { padding: 24, alignItems: "center", gap: 10 },
  hint: { fontSize: 12, lineHeight: 17 },
  retry: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  retryText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  zoomBar: {
    position: "absolute",
    right: 8,
    bottom: 8,
    left: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },
  round: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 17,
  },
  stateChip: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  stateFlag: { fontSize: 16 },
  stateText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
