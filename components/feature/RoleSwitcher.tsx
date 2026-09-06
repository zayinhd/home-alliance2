import { View, Text, Switch, Alert, TouchableOpacity } from "react-native";

import { router } from "expo-router";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/lib/supabase";

export default function RoleSwitcher() {
    const { role, user } = useAuth();
    const normalizedRole = (role || "").replace(/_/g, " ").trim().toLowerCase();
    const isCustomerView = normalizedRole === "customer" || !normalizedRole;

    const [enabled, setEnabled] = useState(
        normalizedRole === "contractor" ||
            normalizedRole === "service provider" ||
            normalizedRole === "service_provider",
    );

    const updateRole = async (nextRole: "customer" | "contractor") => {
        if (!user?.id) {
            Alert.alert("Error", "User session not found.");
            return false;
        }

        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: { role: nextRole },
            });

            if (authError) throw authError;

            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    role: nextRole,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (profileError) throw profileError;

            return true;
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to update role.");
            return false;
        }
    };

    const toggleSwitch = async () => {
        const nextState = !enabled;

        if (isCustomerView) {
            router.push("/(root)/(customer)/become-provider");
            return;
        }

        const nextRole = nextState ? "contractor" : "customer";
        const success = await updateRole(nextRole);

        if (!success) {
            return;
        }

        setEnabled(nextState);

        if (nextState) {
            router.replace("/(root)/(contractor)/home");

            Alert.alert("Switched", "Contractor mode enabled");
        } else {
            router.replace("/(root)/(customer)/home");

            Alert.alert("Switched", "Customer mode enabled");
        }
    };

    return (
        <TouchableOpacity
            onPress={toggleSwitch}
            className="flex-row items-center justify-between bg-gray-100 p-4 rounded-2xl"
        >
            <View className="flex-1 mr-4">
                <Text className="font-Jost-Bold text-base">
                    {isCustomerView ? "Become a Service Provider" : "Customer Mode"}
                </Text>

                <Text className="text-gray-500 text-sm">
                    {isCustomerView
                        ? "Tap to start provider access and enable contractor mode"
                        : "Toggle between customer and contractor"}
                </Text>
            </View>

            <Switch
                value={enabled}
                onValueChange={toggleSwitch}
                disabled={isCustomerView}
            />
        </TouchableOpacity>
    );
}
