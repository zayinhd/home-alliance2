import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                gestureEnabled: Platform.OS !== "ios",
                fullScreenGestureEnabled: Platform.OS !== "ios",
            }}
        />
    );
}
