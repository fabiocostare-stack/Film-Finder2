import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DirectorDiscovery } from "@/components/DirectorDiscovery";
import { DirectorSearch } from "@/components/DirectorSearch";
import { ProfileShortcut } from "@/components/ProfileShortcut";
import { useColors } from "@/hooks/useColors";

export default function DirectorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === "web" ? 67 : insets.top + 10;
  const paddingBottom = Platform.OS === "web" ? 110 : 36;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop, paddingBottom }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topline}>
        <View style={styles.topCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            REGISTI
          </Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Il cinema,{"\n"}dai registi.
          </Text>
        </View>
        <View style={styles.toplineActions}>
          <View style={[styles.regionBadge, { borderColor: colors.border }]}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.regionText, { color: colors.mutedForeground }]}>
              ITALIA
            </Text>
          </View>
          <ProfileShortcut />
        </View>
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Cerca un regista per nome, oppure scopri chi seguire e i suoi film sui
        servizi che hai.
      </Text>

      <DirectorSearch />

      <DirectorDiscovery />

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        I film proposti sono inediti e disponibili sulle piattaforme che hai
        selezionato.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  topline: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  topCopy: { flex: 1 },
  toplineActions: { alignItems: "flex-end", gap: 8 },
  eyebrow: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2.5 },
  pageTitle: {
    marginTop: 10,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1.2,
    fontFamily: "Inter_700Bold",
  },
  regionBadge: {
    marginTop: 5,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  regionText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  description: { maxWidth: 340, fontSize: 13, lineHeight: 20 },
  footer: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 18,
  },
});
