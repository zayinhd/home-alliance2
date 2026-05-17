import {
    Redirect,
} from "expo-router";

import {
    ActivityIndicator,
    View,
} from "react-native";

import { useAuth } from "@/hooks/useAuth";

export default function Index() {
    const {
        user,
        loading,
        role,
    } = useAuth();

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator
                    size="large"
                />
            </View>
        );
    }

    if (!user) {
        return (
            <Redirect
                href="/(auth)/sign-in"
            />
        );
    }

    switch (role) {
        case "customer":
            return (
                <Redirect
                    href="/(root)/(customer)/home"
                />
            );

        case "contractor":
            return (
                <Redirect
                    href="/(root)/(contractor)/home"
                />
            );

        case "admin":
            return (
                <Redirect
                    href="/(root)/(admin)/dashboard"
                />
            );

        default:
            return (
                <Redirect
                    href="/(auth)/sign-in"
                />
            );
    }
}