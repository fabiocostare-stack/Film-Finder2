import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getSearchDirectorsQueryKey,
  useSearchDirectors,
  type DirectorSearchResult,
  type SearchDirectorsParams,
} from "@workspace/api-client-react";
import { usePreferences } from "@/context/PreferencesContext";
import { useColors } from "@/hooks/useColors";

const SUGGESTION_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 280;

function profileUri(profilePath: string | null): string | null {
  return profilePath ? `https://image.tmdb.org/t/p/w185${profilePath}` : null;
}

export function DirectorSearch() {
  const colors = useColors();
  const router = useRouter();
  const { preferences } = usePreferences();
  const [draft, setDraft] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const trimmed = draft.trim();
    const timer = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  const trimmedDraft = draft.trim();
  const params = useMemo<SearchDirectorsParams>(
    () => ({ query: debouncedQuery, limit: SUGGESTION_LIMIT }),
    [debouncedQuery],
  );
  const search = useSearchDirectors(params, {
    query: {
      enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
      queryKey: getSearchDirectorsQueryKey(params),
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
      placeholderData: (previousData) => previousData,
    },
  });

  const followedIds = useMemo(
    () => new Set(preferences.followedDirectors.map((director) => director.id)),
    [preferences.followedDirectors],
  );

  const results = search.data?.results ?? [];
  const isTyping = trimmedDraft !== debouncedQuery;
  const showHint = trimmedDraft.length < MIN_QUERY_LENGTH;
  const isSearching =
    (isTyping || search.isFetching) && debouncedQuery.length >= MIN_QUERY_LENGTH;

  const openDirector = (director: DirectorSearchResult) => {
    router.push({
      pathname: "/director/[id]",
      params: {
        id: String(director.id),
        name: director.name,
        profilePath: director.profilePath ?? "",
      },
    });
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBox,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          testID="director-search-input"
          value={draft}
          onChangeText={setDraft}
          placeholder="Nome del regista"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Cerca un regista per nome"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
        {draft.length > 0 ? (
          <Pressable
            testID="director-search-clear"
            accessibilityRole="button"
            accessibilityLabel="Cancella la ricerca"
            onPress={() => setDraft("")}
            style={({ pressed }) => [
              styles.clearButton,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {showHint ? (
        <View style={[styles.hint, { borderColor: colors.border }]}>
          <Feather name="users" size={20} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Scrivi almeno due lettere: ti suggeriamo i registi mentre digiti.
          </Text>
        </View>
      ) : search.isError ? (
        <View style={[styles.hint, { borderColor: colors.border }]}>
          <Feather name="alert-circle" size={20} color={colors.destructive} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Non riesco a cercare i registi adesso. Controlla la connessione e
            riprova.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Riprova la ricerca dei registi"
            onPress={() => void search.refetch()}
            style={({ pressed }) => [
              styles.retryButton,
              { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Feather name="refresh-cw" size={14} color={colors.primary} />
          </Pressable>
        </View>
      ) : results.length === 0 ? (
        <View style={[styles.hint, { borderColor: colors.border }]}>
          <Feather name="user-x" size={20} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            {search.isFetching
              ? `Cerco registi per “${debouncedQuery}”…`
              : `Nessun regista trovato per “${debouncedQuery}”. Prova con il cognome.`}
          </Text>
        </View>
      ) : (
        <View style={styles.suggestions}>
          <Text style={[styles.suggestionsTitle, { color: colors.foreground }]}>
            {results.length === 1
              ? "1 regista trovato"
              : `${results.length} registi trovati`}
          </Text>
          <View
            style={[
              styles.suggestionList,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            {results.map((director, index) => {
              const uri = profileUri(director.profilePath);
              const isFollowed = followedIds.has(director.id);
              return (
                <Pressable
                  key={director.id}
                  testID={`director-suggestion-${director.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Apri la pagina di ${director.name}`}
                  onPress={() => openDirector(director)}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    index > 0
                      ? { borderTopWidth: 1, borderTopColor: colors.border }
                      : null,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={[
                        styles.portrait,
                        { backgroundColor: colors.secondary },
                      ]}
                      resizeMode="cover"
                      accessibilityLabel={`Foto di ${director.name}`}
                    />
                  ) : (
                    <View
                      style={[
                        styles.portrait,
                        styles.portraitFallback,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Feather
                        name="user"
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </View>
                  )}
                  <View style={styles.suggestionCopy}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.suggestionName,
                        { color: colors.foreground },
                      ]}
                    >
                      {director.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.suggestionMeta,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {director.knownFor.length > 0
                        ? director.knownFor.join(" · ")
                        : "Regista"}
                    </Text>
                  </View>
                  {isFollowed ? (
                    <View
                      style={[
                        styles.followedBadge,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Feather name="check" size={11} color={colors.primary} />
                    </View>
                  ) : null}
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  searchBox: {
    minHeight: 58,
    paddingLeft: 16,
    paddingRight: 10,
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  clearButton: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    minHeight: 92,
    padding: 18,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  hintText: { flex: 1, fontSize: 13, lineHeight: 20 },
  retryButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: { gap: 10 },
  suggestionsTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  suggestionList: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  suggestionRow: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  portrait: { width: 46, height: 52, borderRadius: 13 },
  portraitFallback: { alignItems: "center", justifyContent: "center" },
  suggestionCopy: { flex: 1, gap: 3 },
  suggestionName: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: "Inter_600SemiBold",
  },
  suggestionMeta: { fontSize: 11, lineHeight: 16 },
  followedBadge: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
});

