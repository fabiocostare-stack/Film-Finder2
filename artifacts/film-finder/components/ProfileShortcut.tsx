import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

export function ProfileShortcut() {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Apri il profilo"
      onPress={() => router.push("/profile")}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderWidth: 1,
        borderRadius: 13,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Feather name="user" size={17} color={colors.primary} />
    </Pressable>
  );
}
