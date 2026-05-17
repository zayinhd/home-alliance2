import { Stack } from "expo-router";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/contexts/AuthContext";

import { ThemeProvider } from "@/contexts/ThemeContext";
import "../global.css";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AuthProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                        }}
                    />
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
