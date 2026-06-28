import { useEffect, useState } from "react";

import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
} from "react-native";

import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import LiveMap from "@/components/map/LiveMap";

import ProtectedRoute from "@/components/feature/ProtectedRoute";

import { useAuth } from "@/hooks/useAuth";

import {
    acceptJob,
    getContractorStats,
    getOngoingJobs,
} from "@/services/job.service";

export default function ContractorHomeScreen() {
    const { user } = useAuth();

    const [stats, setStats] = useState<any>(null);

    const [jobs, setJobs] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const statsData = await getContractorStats(user!.id);

            const jobsData = await getOngoingJobs(user!.id);

            setStats(statsData);

            setJobs(jobsData || []);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptJob = async (jobId: string) => {
        try {
            await acceptJob(jobId);

            Alert.alert("Success", "Job accepted successfully");

            fetchData();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <ProtectedRoute
            allowedRoles={[
                "contractor",
                "service provider",
                "service_provider",
            ]}
        >
            <View className="flex-1 bg-white">
                {/* HEADER */}

                <View className="px-6 pt-16 pb-4">
                    <Text className="text-3xl font-Jost-Bold">
                        Service Provider Home
                    </Text>

                    <Text className="text-gray-500 mt-1">
                        View nearby customers
                    </Text>
                </View>

                {/* PROFILE STATS */}

                <View className="px-6 mb-5">
                    <View className="bg-primary rounded-3xl p-5">
                        <Text className="text-white text-xl font-Jost-Bold">
                            {stats?.username}
                        </Text>

                        <Text className="text-white/80 mt-1">
                            {stats?.profession || "Contractor"}
                        </Text>

                        <View className="flex-row justify-between mt-6">
                            <View className="items-center">
                                <Text className="text-white text-2xl font-Jost-Bold">
                                    {stats?.jobs_completed || 0}
                                </Text>

                                <Text className="text-white/80 text-sm mt-1">
                                    Jobs
                                </Text>
                            </View>

                            <View className="items-center">
                                <Text className="text-white text-2xl font-Jost-Bold">
                                    {stats?.rating || 0}
                                </Text>

                                <Text className="text-white/80 text-sm mt-1">
                                    Rating
                                </Text>
                            </View>

                            <View className="items-center">
                                <Text className="text-white text-2xl font-Jost-Bold">
                                    ${stats?.amount_earned || 0}
                                </Text>

                                <Text className="text-white/80 text-sm mt-1">
                                    Earned
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* MAP */}

                <View className="h-[42%] px-6 pb-3">
                    <LiveMap />
                </View>

                {/* JOBS SECTION */}

                <View className="flex-1 px-6 pt-5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-Jost-Bold">
                            Ongoing Jobs
                        </Text>

                        <TouchableOpacity
                            onPress={() =>
                                router.push("/(root)/(contractor)/jobs")
                            }
                        >
                            <Text className="text-primary font-Jost-Medium">
                                View All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={jobs}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity className="bg-gray-100 rounded-2xl p-5 mb-4">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-lg font-Jost-Bold">
                                            {item.service}
                                        </Text>

                                        <Text className="text-gray-500 mt-1">
                                            Customer: {item?.customer?.username}
                                        </Text>

                                        <Text className="text-gray-500 mt-1">
                                            Location: {item.location}
                                        </Text>

                                        <Text className="text-primary font-Jost-Bold mt-2">
                                            ${item.budget}
                                        </Text>

                                        <View className="mt-3 self-start px-3 py-1 rounded-full bg-primary">
                                            <Text className="text-white text-xs font-Jost-Medium">
                                                {item.status}
                                            </Text>
                                        </View>
                                    </View>

                                    {item.status === "pending" && (
                                        <TouchableOpacity
                                            onPress={() =>
                                                handleAcceptJob(item.id)
                                            }
                                            className="bg-primary px-4 py-3 rounded-2xl"
                                        >
                                            <Text className="text-white font-Jost-Bold">
                                                Accept
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View className="items-center mt-20">
                                <Ionicons
                                    name="briefcase-outline"
                                    size={60}
                                    color="#ccc"
                                />

                                <Text className="text-gray-500 text-base mt-4">
                                    No ongoing jobs available
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </ProtectedRoute>
    );
}
