import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import { getDashboardStats } from "@/services/admin.service";

export default function AdminDashboardScreen() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.warn("Failed to load admin dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-6">
                Admin Dashboard
            </Text>

            <TouchableOpacity
                onPress={() =>
                    router.push({
                        pathname: "/(root)/(admin)/users",
                        params: { role: "all" },
                    })
                }
                className="bg-primary rounded-3xl p-6 mb-4"
            >
                <Text className="text-white text-xl font-Jost-Bold">
                    Total Users
                </Text>
                <Text className="text-white text-4xl mt-2">
                    {stats?.totalUsers ?? 0}
                </Text>
                <Text className="text-white/80 mt-2">Tap to manage users</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() =>
                    router.push({
                        pathname: "/(root)/(admin)/users",
                        params: { role: "service provider" },
                    })
                }
                className="bg-secondary rounded-3xl p-6 mb-4"
            >
                <Text className="text-white text-xl font-Jost-Bold">
                    Service Providers
                </Text>
                <Text className="text-white text-4xl mt-2">
                    {stats?.totalContractors ?? 0}
                </Text>
                <Text className="text-white/80 mt-2">
                    Tap to view providers
                </Text>
            </TouchableOpacity>

            <View className="bg-gray-100 rounded-3xl p-6 mb-4">
                <Text className="text-gray-700 text-lg font-Jost-Bold">
                    Total Revenue
                </Text>
                <Text className="text-slate-900 text-3xl mt-2">
                    Ghc {stats?.totalRevenue ?? 0}
                </Text>
            </View>

            <View className="bg-gray-100 rounded-3xl p-6 mb-4">
                <Text className="text-gray-700 text-lg font-Jost-Bold">
                    Jobs Overview
                </Text>
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(root)/(admin)/jobs",
                            params: { status: "pending" },
                        })
                    }
                >
                    <Text className="text-slate-900 mt-2">
                        Pending: {stats?.pendingJobs ?? 0}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(root)/(admin)/jobs",
                            params: { status: "completed" },
                        })
                    }
                >
                    <Text className="text-slate-900 mt-1">
                        Completed: {stats?.completedJobs ?? 0}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(root)/(admin)/jobs",
                            params: { status: "cancelled" },
                        })
                    }
                >
                    <Text className="text-slate-900 mt-1">
                        Cancelled: {stats?.cancelledJobs ?? 0}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="bg-blue-50 rounded-3xl p-6 mb-8">
                <Text className="text-blue-900 text-lg font-Jost-Bold mb-3">
                    Quick Actions
                </Text>
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(root)/(admin)/verification",
                            params: { status: "pending" },
                        })
                    }
                    className="bg-white border border-blue-200 rounded-2xl px-4 py-3 mb-3"
                >
                    <Text className="text-blue-900 font-Jost-Bold">
                        Review Pending Verifications
                    </Text>
                    <Text className="text-blue-700 mt-1">
                        Pending: {stats?.pendingVerifications ?? 0}
                    </Text>
                </TouchableOpacity>
                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: "/(root)/(admin)/users",
                                params: { openCreate: "1" },
                            })
                        }
                        className="bg-primary px-4 py-3 rounded-2xl mr-3"
                    >
                        <Text className="text-white font-Jost-Bold">
                            Add User
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push("/(root)/(admin)/profile")}
                        className="bg-white border border-blue-200 px-4 py-3 rounded-2xl"
                    >
                        <Text className="text-blue-800 font-Jost-Bold">
                            Open Profile
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
