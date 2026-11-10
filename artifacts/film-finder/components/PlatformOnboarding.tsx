import { useState } from "react";
import {
  useListMovieProviders,
  getListMovieProvidersQueryKey,
  getTmdbApiKey,
  setTmdbApiKey,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getCatalogErrorMessage } from "@/components/CatalogNotice";
import { usePreferences } from "@/context/PreferencesContext";
import { useColors } from "@/hooks/useColors";

const TMDB_API_SETTINGS_URL = "https://www.themoviedb.org/settings/api";

const GUIDE_STEPS = [
  "Accedi o registrati gratuitamente su themoviedb.org.",
  "Apri Impostazioni → API e genera una chiave Developer.",
  "Copia la «Chiave API (v3 auth)» e incollala qui sotto.",
];

export default function PlatformOnboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isReady,
    preferences,
    toggleProvider,
    completePlatformSetup,
  } = usePreferences();

  const [apiKeyInput, setApiKeyInput] = useState<string>(
    () => getTmdbApiKey() ?? "",
  );
  const [hasStoredKey, setHasStoredKey] = useState<boolean>(() =>
    Boolean(getTmdbApiKey()),
  );
  const [editingKey, setEditingKey] = useState<boolean>(false);
  const [hideKey, setHideKey] = useState<boolean>(false);
  const [submittedAttempt, setSubmittedAttempt] = useState<boolean>(false);

  const providers = useListMovieProviders(
    { region: "IT" },
    {
      query: {
        enabled: isReady && hasStoredKey,
        queryKey: getListMovieProvidersQueryKey({ region: "IT" }),
        staleTime: 12 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  );

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setSubmittedAttempt(true);
    setTmdbApiKey(trimmed);
    setHasStoredKey(true);
    setEditingKey(false);
    void providers.refetch();
  };

  const handleOpenTmdb = () => {
    void Linking.openURL(TMDB_API_SETTINGS_URL);
  };

  const needsApiKeyStep =
    !hasStoredKey || editingKey || (providers.isError && hasStoredKey);
  const selectedCount = preferences.selectedProviders.length;
  const topInset = Platform.OS === "web" ? 48 : insets.top + 14;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom + 12;
  const canSubmitKey = apiKeyInput.trim().length >= 16 && !providers.isFetching;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topInset,
            paddingBottom: needsApiKeyStep ? 48 + bottomInset : 170 + bottomInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
            <Feather name="film" size={15} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>
            FILM FINDER
          </Text>
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.step, { color: colors.primary }]}>
              {needsApiKeyStep ? "PASSO 1 DI 2" : "PASSO 2 DI 2"}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={[colors.accent, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: colors.border }]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>
                {needsApiKeyStep ? "BENVENUTO" : "QUASI PRONTO"}
              </Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {needsApiKeyStep
                  ? "Il tuo cinema,\nsenza rumore."
                  : "Dove guardi\ni tuoi film?"}
              </Text>
            </View>
            <View
              style={[styles.heroIconBadge, { backgroundColor: colors.primary }]}
            >
              <Feather
                name={needsApiKeyStep ? "key" : "tv"}
                size={24}
                color={colors.primaryForeground}
              />
            </View>
          </View>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {needsApiKeyStep
              ? "Per esplorare filmografie, uscite nelle sale italiane e cataloghi streaming, collega la tua chiave personale gratuita di The Movie Database (TMDB)."
              : "Seleziona i servizi di streaming che usi. Ti proporremo solo film disponibili lì, scelti sui tuoi gusti."}
          </Text>

          <View style={styles.featurePills}>
            <View
              style={[
                styles.featurePill,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="star" size={12} color={colors.primary} />
              <Text style={[styles.featurePillText, { color: colors.foreground }]}>
                Registi & Autori
              </Text>
            </View>
            <View
              style={[
                styles.featurePill,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="tv" size={12} color={colors.primary} />
              <Text style={[styles.featurePillText, { color: colors.foreground }]}>
                Streaming Italia
              </Text>
            </View>
            <View
              style={[
                styles.featurePill,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="globe" size={12} color={colors.primary} />
              <Text style={[styles.featurePillText, { color: colors.foreground }]}>
                In Sala & Viaggi
              </Text>
            </View>
          </View>
        </LinearGradient>

        {needsApiKeyStep ? (
          <View
            style={[
              styles.apiCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.apiCardHeader}>
              <View
                style={[styles.apiIconTile, { backgroundColor: colors.accent }]}
              >
                <Feather name="unlock" size={18} color={colors.primary} />
              </View>
              <View style={styles.apiHeaderCopy}>
                <View style={styles.apiTitleRow}>
                  <Text style={[styles.apiTitle, { color: colors.foreground }]}>
                    Chiave API TMDB
                  </Text>
                  <View
                    style={[
                      styles.freeBadge,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[styles.freeBadgeText, { color: colors.primary }]}
                    >
                      GRATUITA
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.apiSubtitle, { color: colors.mutedForeground }]}
                >
                  Resta salvata solo sul tuo dispositivo
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.guideBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.guideHeader}>
                <Text
                  style={[styles.guideTitle, { color: colors.foreground }]}
                >
                  Come ottenerla in 1 minuto
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={handleOpenTmdb}
                  style={({ pressed }) => [
                    styles.tmdbLinkPill,
                    {
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.tmdbLinkText, { color: colors.primary }]}
                  >
                    Apri TMDB
                  </Text>
                  <Feather
                    name="external-link"
                    size={11}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              {GUIDE_STEPS.map((stepText, idx) => (
                <View key={idx} style={styles.guideStepRow}>
                  <View
                    style={[
                      styles.guideStepNumber,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.guideStepNumberText,
                        { color: colors.primary },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.guideStepText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {stepText}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                La tua chiave API (v3 auth)
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background,
                    borderColor:
                      providers.isError && submittedAttempt
                        ? colors.destructive
                        : colors.border,
                  },
                ]}
              >
                <Feather
                  name="key"
                  size={16}
                  color={colors.mutedForeground}
                />
                <TextInput
                  testID="onboarding-api-key-input"
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder="Es. a1b2c3d4e5f6g7h8i9j0..."
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={hideKey}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveApiKey}
                  style={[styles.textInput, { color: colors.foreground }]}
                />
                {apiKeyInput.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      hideKey ? "Mostra chiave" : "Nascondi chiave"
                    }
                    onPress={() => setHideKey((prev) => !prev)}
                    hitSlop={8}
                    style={styles.inputIconAction}
                  >
                    <Feather
                      name={hideKey ? "eye" : "eye-off"}
                      size={15}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ) : null}
                {apiKeyInput.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancella chiave"
                    onPress={() => setApiKeyInput("")}
                    hitSlop={8}
                    style={styles.inputIconAction}
                  >
                    <Feather
                      name="x"
                      size={15}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {providers.isError && (submittedAttempt || hasStoredKey) ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.destructive,
                  },
                ]}
              >
                <Feather
                  name="alert-circle"
                  size={16}
                  color={colors.destructive}
                />
                <Text
                  style={[
                    styles.errorBannerText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {getCatalogErrorMessage(
                    providers.error,
                    "La chiave inserita non sembra valida o il servizio non è raggiungibile. Controlla di aver copiato la «Chiave API (v3 auth)».",
                  )}
                </Text>
              </View>
            ) : null}

            <Pressable
              testID="save-onboarding-api-key"
              accessibilityRole="button"
              disabled={!canSubmitKey}
              onPress={handleSaveApiKey}
              style={({ pressed }) => [
                styles.primaryAction,
                {
                  backgroundColor: colors.primary,
                  opacity: !canSubmitKey ? 0.45 : pressed ? 0.8 : 1,
                },
              ]}
            >
              {providers.isFetching ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.primaryActionText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Verifica della chiave in corso…
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.primaryActionText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Attiva catalogo e continua
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={17}
                    color={colors.primaryForeground}
                  />
                </>
              )}
            </Pressable>

            {editingKey && providers.data ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditingKey(false)}
                style={({ pressed }) => [
                  styles.cancelEditButton,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.cancelEditText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Torna alla selezione piattaforme
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View
              style={[
                styles.connectedBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.connectedInfo}>
                <Feather
                  name="check-circle"
                  size={15}
                  color={colors.primary}
                />
                <Text
                  style={[styles.connectedText, { color: colors.foreground }]}
                >
                  Catalogo TMDB collegato
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditingKey(true)}
                style={({ pressed }) => [
                  styles.changeKeyButton,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <Feather name="key" size={12} color={colors.primary} />
                <Text
                  style={[styles.changeKeyText, { color: colors.primary }]}
                >
                  Modifica chiave
                </Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Le tue piattaforme
                </Text>
                <Text
                  style={[
                    styles.sectionCaption,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Catalogo streaming in Italia
                </Text>
              </View>
              <View
                style={[styles.countPill, { borderColor: colors.border }]}
              >
                <Text style={[styles.countText, { color: colors.primary }]}>
                  {selectedCount}
                </Text>
                <Text
                  style={[styles.countLabel, { color: colors.mutedForeground }]}
                >
                  scelte
                </Text>
              </View>
            </View>

            {providers.isLoading ? (
              <View
                style={[styles.statusPanel, { borderColor: colors.border }]}
              >
                <ActivityIndicator color={colors.primary} />
                <Text
                  style={[styles.statusText, { color: colors.mutedForeground }]}
                >
                  Carico i servizi disponibili in Italia…
                </Text>
              </View>
            ) : (
              <View style={styles.providerGrid}>
                {providers.data?.results.map((provider) => {
                  const selected = preferences.selectedProviders.some(
                    (item) => item.id === provider.id,
                  );
                  const logoUri = provider.logoPath
                    ? `https://image.tmdb.org/t/p/w92${provider.logoPath}`
                    : null;
                  return (
                    <Pressable
                      key={provider.id}
                      testID={`onboarding-provider-${provider.id}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() => toggleProvider(provider)}
                      style={({ pressed }) => [
                        styles.providerChip,
                        {
                          backgroundColor: selected
                            ? colors.accent
                            : colors.card,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      {logoUri ? (
                        <Image
                          source={{ uri: logoUri }}
                          style={styles.providerLogo}
                          resizeMode="cover"
                        />
                      ) : null}
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.providerName,
                          {
                            color: selected
                              ? colors.foreground
                              : colors.mutedForeground,
                            fontFamily: selected
                              ? "Inter_600SemiBold"
                              : "Inter_500Medium",
                          },
                        ]}
                      >
                        {provider.name}
                      </Text>
                      <Feather
                        name={selected ? "check-circle" : "plus-circle"}
                        size={16}
                        color={
                          selected ? colors.primary : colors.mutedForeground
                        }
                      />
                    </Pressable>
                  );
                })}
                {providers.data?.results.length === 0 ? (
                  <Text
                    style={[
                      styles.sectionCaption,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Nessuna piattaforma trovata per questa regione.
                  </Text>
                ) : null}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!needsApiKeyStep ? (
        <View
          style={[
            styles.footer,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: bottomInset,
            },
          ]}
        >
          <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
            Potrai modificare piattaforme e chiave API in qualsiasi momento dal
            Profilo.
          </Text>
          <Pressable
            testID="complete-platform-setup"
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedCount === 0 }}
            disabled={selectedCount === 0}
            onPress={completePlatformSetup}
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor: colors.primary,
                opacity: selectedCount === 0 ? 0.45 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[styles.continueText, { color: colors.primaryForeground }]}
            >
              {selectedCount === 0
                ? "Scegli almeno una piattaforma"
                : `Inizia con ${selectedCount} ${selectedCount === 1 ? "piattaforma" : "piattaforme"}`}
            </Text>
            <Feather
              name="arrow-right"
              size={17}
              color={colors.primaryForeground}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.6 },
  stepBadge: {
    marginLeft: "auto",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  step: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  hero: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: { flex: 1, gap: 6 },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
  },
  eyebrow: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.8 },
  title: {
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.9,
    fontFamily: "Inter_700Bold",
  },
  description: { fontSize: 13, lineHeight: 20 },
  featurePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  featurePillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  apiCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    gap: 18,
  },
  apiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  apiIconTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  apiHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  apiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  apiTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  freeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  apiSubtitle: {
    fontSize: 12,
  },
  guideBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  guideTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  tmdbLinkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tmdbLinkText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  guideStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guideStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  guideStepNumberText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  guideStepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  inputWrapper: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  inputIconAction: {
    padding: 4,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  cancelEditButton: {
    alignSelf: "center",
    paddingVertical: 6,
  },
  cancelEditText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  connectedBar: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  connectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  connectedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  changeKeyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeKeyText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  sectionCaption: { marginTop: 4, fontSize: 11, lineHeight: 16 },
  countPill: {
    minWidth: 66,
    minHeight: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  countText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  countLabel: { fontSize: 9, fontFamily: "Inter_500Medium" },
  statusPanel: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  statusText: { fontSize: 12 },
  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  providerChip: {
    minHeight: 46,
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  providerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  providerName: { maxWidth: 185, fontSize: 12 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  footerHint: { textAlign: "center", fontSize: 10 },
  continueButton: {
    minHeight: 52,
    paddingHorizontal: 17,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  continueText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
