import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/services/auth.service";
import { supabase } from "@/lib/supabase";
import { getDashboardStats } from "@/services/admin.service";

export default function AdminProfileScreen() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);

                const [{ data }, dashboardStats] = await Promise.all([
                    supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single(),
                    getDashboardStats(),
                ]);

                setProfile(data);
                setStats(dashboardStats);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user?.id]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace("/(auth)/sign-in");
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Unable to log out.");
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    const verifiedRate = stats?.totalUsers
        ? Math.round(
              (Number(stats.verifiedContractors || 0) /
                  Number(stats.totalUsers)) *
                  100,
          )
        : 0;

    const completionRate = stats?.totalJobs
        ? Math.round(
              (Number(stats.completedJobs || 0) / Number(stats.totalJobs)) *
                  100,
          )
        : 0;

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-2">Admin Profile</Text>
            <Text className="text-gray-500 mb-6">
                Monitor account health and system performance.
            </Text>

            <View className="bg-primary rounded-3xl p-6 mb-5">
                <Text className="text-white text-xl font-Jost-Bold">
                    {profile?.username ||
                        user?.user_metadata?.username ||
                        "Admin"}
                </Text>
                <Text className="text-white/80 mt-1">
                    {profile?.email || user?.email || "admin@example.com"}
                </Text>
                <View className="self-start mt-3 px-3 py-1 rounded-full bg-white/20">
                    <Text className="text-white font-Jost-Medium">
                        {profile?.role || "admin"}
                    </Text>
                </View>
            </View>

            <View className="flex-row mb-4">
                <View className="flex-1 bg-blue-50 rounded-2xl p-4 mr-2">
                    <Text className="text-gray-500 text-xs">Verified Rate</Text>
                    <Text className="text-blue-700 text-2xl font-Jost-Bold mt-1">
                        {verifiedRate}%
                    </Text>
                </View>
                <View className="flex-1 bg-emerald-50 rounded-2xl p-4 ml-2">
                    <Text className="text-gray-500 text-xs">
                        Completion Rate
                    </Text>
                    <Text className="text-emerald-700 text-2xl font-Jost-Bold mt-1">
                        {completionRate}%
                    </Text>
                </View>
            </View>

            <View className="bg-gray-100 rounded-3xl p-5 mb-4">
                <Text className="text-gray-700 font-Jost-Bold mb-3">
                    Health Stats
                </Text>
                <Text className="text-gray-600 mt-1">
                    Total Users: {stats?.totalUsers ?? 0}
                </Text>
                <Text className="text-gray-600 mt-1">
                    Pending Verifications: {stats?.pendingVerifications ?? 0}
                </Text>
                <Text className="text-gray-600 mt-1">
                    Active Jobs: {stats?.pendingJobs ?? 0}
                </Text>
                <Text className="text-gray-600 mt-1">
                    Revenue: Ghc {stats?.totalRevenue ?? 0}
                </Text>
            </View>

            <View className="bg-gray-100 rounded-3xl p-5 mb-5">
                <Text className="text-gray-700 font-Jost-Bold mb-3">
                    Account Details
                </Text>
                <Text className="text-gray-600 mt-1">
                    Phone: {profile?.phone || "—"}
                </Text>
                <Text className="text-gray-600 mt-1">
                    Profession: {profile?.professions || "—"}
                </Text>
                <Text className="text-gray-600 mt-1">
                    Verified: {profile?.is_verified ? "Yes" : "No"}
                </Text>
                <Text className="text-gray-600 mt-1">
                    Status: {profile?.is_suspended ? "Suspended" : "Active"}
                </Text>
            </View>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500 rounded-2xl py-4 items-center mb-8"
            >
                <Text className="text-white font-Jost-Bold">Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
