import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

/** Top-right entry point for the profile, which is no longer a bottom tab. */
export function ProfileShortcut() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      testID="profile-shortcut"
      accessibilityRole="button"
      accessibilityLabel="Apri il profilo e le impostazioni"
      onPress={() => router.push("/profile")}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
        <Feather name="user" size={15} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
