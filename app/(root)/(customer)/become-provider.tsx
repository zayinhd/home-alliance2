import { useState } from "react";

import { Alert, ScrollView, Text, View } from "react-native";

import { router } from "expo-router";

import Button from "@/components/ui/Button";

import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/lib/supabase";

export default function BecomeProviderScreen() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);

    const handleBecomeProvider = async () => {
        if (!user?.id) {
            Alert.alert("Error", "You need to be signed in first.");
            return;
        }

        try {
            setLoading(true);

            const fallbackUsername =
                user.user_metadata?.username ||
                user.email?.split("@")[0] ||
                `user-${user.id.slice(0, 8)}`;

            const { data: existingProfile, error: profileFetchError } =
                await supabase
                    .from("profiles")
                    .select("username, email, full_name, role")
                    .eq("id", user.id)
                    .single();

            if (profileFetchError && profileFetchError.code !== "PGRST116") {
                throw profileFetchError;
            }

            const { error } = await supabase.auth.updateUser({
                data: {
                    role: "contractor",
                    username:
                        existingProfile?.username ||
                        user.user_metadata?.username ||
                        fallbackUsername,
                },
            });

            if (error) throw error;

            const { error: profileError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: user.id,
                        username:
                            existingProfile?.username ||
                            user.user_metadata?.username ||
                            fallbackUsername,
                        email: existingProfile?.email || user.email || "",
                        full_name:
                            existingProfile?.full_name ||
                            user.user_metadata?.full_name ||
                            fallbackUsername,
                        role: "contractor",
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "id",
                    },
                );

            if (profileError) throw profileError;

            Alert.alert(
                "Success",
                "You are now a service provider. Contractor mode is available.",
            );

            router.replace("/(root)/(contractor)/home");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to update role.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-4">
                Become a Service Provider
            </Text>

            <Text className="text-gray-600 text-base leading-7">
                Join the Service Provider side of Home Alliance and start accepting
                jobs, managing bookings, and using service provider mode.
            </Text>

            <View className="mt-8 bg-gray-100 rounded-2xl p-5">
                <Text className="font-Jost-Bold text-lg mb-2">
                    What you get
                </Text>

                <Text className="text-gray-600">
                    • Receive booking requests
                    {'\n'}• Manage your schedule and jobs
                    {'\n'}• Use the contractor profile and tracking tools
                    {'\n'}• Toggle into contractor mode any time
                </Text>
            </View>

            <View className="mt-10">
                <Button
                    title="Continue as Service Provider"
                    onPress={handleBecomeProvider}
                    loading={loading}
                />
            </View>

            <View className="mt-6">
                <Button
                    title="Cancel"
                    onPress={() => router.back()}
                    className="bg-gray-300"
                />
            </View>
        </ScrollView>
    );
}
