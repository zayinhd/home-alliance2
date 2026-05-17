import {
    View,
    Text,
    Switch,
    Alert,
} from "react-native";

import { router } from "expo-router";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";

export default function RoleSwitcher() {
    const { role } = useAuth();

    const [enabled, setEnabled] =
        useState(
            role === "contractor"
        );

    const toggleSwitch = () => {
        const nextState = !enabled;

        setEnabled(nextState);

        if (nextState) {
            router.replace(
                "/(root)/(contractor)/home"
            );

            Alert.alert(
                "Switched",
                "Contractor mode enabled"
            );
        } else {
            router.replace(
                "/(root)/(customer)/home"
            );

            Alert.alert(
                "Switched",
                "Customer mode enabled"
            );
        }
    };

    return (
        <View className="flex-row items-center justify-between bg-gray-100 p-4 rounded-2xl">
            <View>
                <Text className="font-Jost-Bold text-base">
                    Contractor Mode
                </Text>

                <Text className="text-gray-500 text-sm">
                    Toggle between customer and contractor
                </Text>
            </View>

            <Switch
                value={enabled}
                onValueChange={toggleSwitch}
            />
        </View>
    );
}