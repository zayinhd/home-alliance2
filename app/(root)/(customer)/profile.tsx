import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    Switch,
    RefreshControl,
} from "react-native";

import { useEffect, useState } from "react";

import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import Avatar from "@/components/ui/Avatar";

import RoleSwitcher from "@/components/feature/RoleSwitcher";

import { useAuth } from "@/hooks/useAuth";

import { signOut } from "@/services/auth.service";

import { supabase } from "@/lib/supabase";

export default function CustomerProfileScreen() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [sharingLocation, setSharingLocation] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadProfile = async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select(
                    "username, email, address, location_tracking_enabled",
                )
                .eq("id", user.id)
                .single();

            if (error) throw error;
            setProfile(data || null);
            setSharingLocation(Boolean(data?.location_tracking_enabled));
        } catch (error: any) {
            console.warn("Failed to load profile address", error);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [user?.id]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await loadProfile();
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();

            router.replace("/(auth)/sign-in");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",

                    onPress: async () => {
                        try {
                            if (!user) return;

                            await supabase
                                .from("profiles")
                                .delete()
                                .eq("id", user.id);

                            await signOut();

                            router.replace("/(auth)/sign-in");
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                        }
                    },
                },
            ],
        );
    };

    const handleLocationSharingToggle = (value: boolean) => {
        Alert.alert(
            value ? "Enable location sharing" : "Disable location sharing",
            value
                ? "Allow active service providers to view your live location while your jobs are in progress?"
                : "Stop sharing your live location with service providers?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: value ? "Enable" : "Disable",
                    onPress: async () => {
                        try {
                            if (!user?.id) return;

                            const { error } = await supabase
                                .from("profiles")
                                .update({
                                    location_tracking_enabled: value,
                                })
                                .eq("id", user.id);

                            if (error) throw error;

                            setSharingLocation(value);
                            setProfile((prev: any) => ({
                                ...(prev || {}),
                                location_tracking_enabled: value,
                            }));
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.message ||
                                    "Unable to update location sharing setting.",
                            );
                        }
                    },
                },
            ],
        );
    };

    return (
        <ScrollView
            className="flex-1 bg-white px-6 pt-20"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#2a6ff2"
                />
            }
        >
            {/* PROFILE */}

            <View className="items-center">
                <Avatar
                    username={user?.user_metadata?.username}
                    email={user?.email}
                />

                <Text className="text-2xl font-Jost-Bold mt-4">
                    {profile?.username || user?.user_metadata?.username}
                </Text>

                <Text className="text-gray-500 mt-1">
                    {profile?.email || user?.email}
                </Text>

                <View className="mt-3 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                    <Text className="text-blue-700 text-xs font-Jost-Bold">
                        Provider conversion: {user?.user_metadata?.role === "contractor" || user?.user_metadata?.role === "service_provider" || user?.user_metadata?.role === "service provider" ? "Active" : "Available"}
                    </Text>
                </View>

                <Text className="text-gray-600 mt-2 text-center">
                    {profile?.address || "Location not set yet"}
                </Text>

                <Text className="text-primary mt-2 text-xs font-Jost-Medium">
                    {profile?.location_tracking_enabled
                        ? "Location tracking is active"
                        : "Location tracking is off"}
                </Text>

                <View className="w-full mt-4 rounded-2xl bg-gray-100 p-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <Text className="font-Jost-Bold text-sm text-gray-800">
                                Allow customer location tracking
                            </Text>
                            <Text className="text-gray-500 mt-1 text-xs">
                                Active providers can only track your location while a job is accepted or in progress.
                            </Text>
                        </View>

                        <Switch
                            value={sharingLocation}
                            onValueChange={handleLocationSharingToggle}
                            trackColor={{ false: "#d1d5db", true: "#2a6ff2" }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>
            </View>

            {/* ROLE SWITCH */}

            <View className="mt-10">
                <RoleSwitcher />
            </View>

            {/* MENU LIST */}

            <View className="mt-10 gap-4">
                {/* EDIT PROFILE */}

                <TouchableOpacity
                    className="flex-row items-center justify-between bg-gray-100 p-5 rounded-2xl"
                    onPress={() =>
                        router.push("/(root)/(customer)/edit-profile")
                    }
                >
                    <View className="flex-row items-center">
                        <Ionicons
                            name="person-circle"
                            size={24}
                            color="#2a6ff2ff"
                        />

                        <Text className="ml-4 font-Jost-Medium text-base">
                            Edit Profile
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* HISTORY */}

                <TouchableOpacity
                    className="flex-row items-center justify-between bg-gray-100 p-5 rounded-2xl"
                    onPress={() => router.push("/(root)/(customer)/history")}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="time" size={24} color="#2a6ff2ff" />

                        <Text className="ml-4 font-Jost-Medium text-base">
                            History
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-row items-center justify-between bg-gray-100 p-5 rounded-2xl"
                    onPress={() => router.push("/(root)/(customer)/become-provider")}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="briefcase" size={24} color="#2a6ff2ff" />

                        <Text className="ml-4 font-Jost-Medium text-base">
                            Want to become a service provider?
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            {/* ACTION BUTTONS */}

            <View className="mt-10 gap-4 pb-10">
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-primary py-4 rounded-2xl items-center"
                >
                    <Text className="text-white font-Jost-Bold text-base">
                        Logout
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    className="bg-danger py-4 rounded-2xl items-center"
                >
                    <Text className="text-white font-Jost-Bold text-base">
                        Delete Account
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
