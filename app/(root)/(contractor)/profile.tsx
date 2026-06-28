import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";

import { useEffect, useState } from "react";

import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import Avatar from "@/components/ui/Avatar";

import RoleSwitcher from "@/components/feature/RoleSwitcher";

import { useAuth } from "@/hooks/useAuth";

import { signOut } from "@/services/auth.service";

import { supabase } from "@/lib/supabase";

export default function ContractorProfileScreen() {
    const { user } = useAuth();

    const [profile, setProfile] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user?.id)
                .single();

            if (error) {
                throw error;
            }

            setProfile(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-20">
            {/* PROFILE */}

            <View className="items-center">
                <Avatar username={profile?.username} email={profile?.email} />

                <Text className="text-2xl font-Jost-Bold mt-4">
                    {profile?.username}
                </Text>

                <Text className="text-gray-500 mt-1">{profile?.email}</Text>

                {/* PROFESSION */}

                <View className="flex-row items-center mt-4 bg-gray-100 px-4 py-2 rounded-2xl">
                    <Ionicons name="briefcase" size={18} color="#2a6ff2ff" />

                    <Text className="ml-2 font-Jost-Medium text-base">
                        {Array.isArray(profile?.professions)
                            ? profile.professions.join(", ") ||
                              "No profession added"
                            : profile?.professions ||
                              profile?.profession ||
                              "No profession added"}
                    </Text>
                </View>

                {/* PHONE NUMBER */}

                <View className="flex-row items-center mt-3 bg-gray-100 px-4 py-2 rounded-2xl">
                    <Ionicons name="call" size={18} color="#2a6ff2ff" />

                    <Text className="ml-2 font-Jost-Medium text-base">
                        {profile?.phone || "No phone number"}
                    </Text>
                </View>

                {/* RATINGS */}

                <View className="flex-row items-center mt-4">
                    <Ionicons name="star" size={20} color="#f29f05ff" />

                    <Text className="ml-2 font-Jost-Bold text-lg">
                        {profile?.rating || "0.0"} Rating
                    </Text>

                    <Text className="text-gray-500 ml-2">
                        ({profile?.reviews_count || 0} Reviews)
                    </Text>
                </View>

                {/* STATS */}

                <View className="flex-row justify-between w-full mt-8 bg-primary rounded-3xl p-5">
                    <View className="items-center flex-1">
                        <Text className="text-white text-2xl font-Jost-Bold">
                            {profile?.jobs_completed || 0}
                        </Text>

                        <Text className="text-white/80 mt-1">Jobs</Text>
                    </View>

                    <View className="items-center flex-1">
                        <Text className="text-white text-2xl font-Jost-Bold">
                            ${profile?.amount_earned || 0}
                        </Text>

                        <Text className="text-white/80 mt-1">Earned</Text>
                    </View>

                    <View className="items-center flex-1">
                        <Text className="text-white text-2xl font-Jost-Bold">
                            {profile?.experience_years || 0}Y
                        </Text>

                        <Text className="text-white/80 mt-1">Experience</Text>
                    </View>
                </View>
            </View>

            {/* ROLE SWITCH */}

            <View className="mt-10">
                <RoleSwitcher />
            </View>

            {/* MENU LIST */}

            <View className="mt-10 gap-4">
                <TouchableOpacity
                    className="flex-row items-center justify-between bg-gray-100 p-5 rounded-2xl"
                    onPress={() =>
                        router.push("/(root)/(contractor)/edit-profile")
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

                <TouchableOpacity
                    className="flex-row items-center justify-between bg-gray-100 p-5 rounded-2xl"
                    onPress={() =>
                        router.push("/(root)/(contractor)/verification")
                    }
                >
                    <View className="flex-row items-center">
                        <Ionicons
                            name="shield-checkmark"
                            size={24}
                            color="#2a6ff2ff"
                        />

                        <Text className="ml-4 font-Jost-Medium text-base">
                            Verification
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-row items-center justify-between bg-gray-100 p-5 rounded-2xl"
                    onPress={() => router.push("/(root)/(contractor)/history")}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="time" size={24} color="#2a6ff2ff" />

                        <Text className="ml-4 font-Jost-Medium text-base">
                            Work History
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
