import { Stack } from "expo-router";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import GlobalBackSwipe from "@/components/feature/GlobalBackSwipe";

import { AuthProvider } from "@/contexts/AuthContext";

import { ThemeProvider } from "@/contexts/ThemeContext";
import "../global.css";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AuthProvider>
                    <GlobalBackSwipe>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                gestureEnabled: true,
                                fullScreenGestureEnabled: true,
                            }}
                        />
                    </GlobalBackSwipe>
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
