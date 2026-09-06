import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerBookings } from "@/services/job.service";

const getLatestCompletedJob = (jobList: any[] = []) => {
    const completedJobs = jobList.filter((job) => job.status === "completed");

    if (!completedJobs.length) return null;

    return [...completedJobs].sort(
        (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
    )[0];
};

const statusFilters = [
    "all",
    "pending",
    "accepted",
    "in_progress",
    "completed",
    "cancelled",
];

export default function CustomerJobsScreen() {
    const { user } = useAuth();

    const [jobs, setJobs] = useState<any[]>([]);
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);

    const [autoReviewTriggered, setAutoReviewTriggered] = useState(false);

    useEffect(() => {
        loadJobs();
    }, [user?.id, status]);

    const loadJobs = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const data = await getCustomerBookings(user.id, status);
            setJobs(data || []);

            if (!autoReviewTriggered) {
                const latestCompletedJob = getLatestCompletedJob(data || []);

                if (latestCompletedJob) {
                    openReview(latestCompletedJob);
                    setAutoReviewTriggered(true);
                }
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    const openReview = (job: any) => {
        router.push({
            pathname: "/(root)/(customer)/review-job",
            params: {
                job: JSON.stringify(job),
            },
        });
    };

    return (
        <View className="flex-1 bg-white px-4 pt-14">
            <Text className="text-3xl font-Jost-Bold mb-4">My Bookings</Text>

            <FlatList
                horizontal
                data={statusFilters}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                className="mb-4 max-h-12"
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setStatus(item)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                            status === item ? "bg-primary" : "bg-gray-100"
                        }`}
                    >
                        <Text
                            className={`font-Jost-Medium ${
                                status === item ? "text-white" : "text-gray-700"
                            }`}
                        >
                            {item === "all" ? "All" : item.replace("_", " ")}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2a6ff2ff" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View className="bg-gray-100 rounded-2xl p-5 mb-4">
                            <Text className="text-lg font-Jost-Bold">
                                {item.service}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Provider:{" "}
                                {item.service_provider?.username || "—"}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Budget: Ghc {item.budget || 0}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Status: {item.status || "—"}
                            </Text>

                            <View className="flex-row mt-4">
                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/(root)/(customer)/tracking",
                                        )
                                    }
                                    className="bg-primary px-4 py-2 rounded-xl mr-2"
                                >
                                    <Text className="text-white font-Jost-Bold">
                                        Track
                                    </Text>
                                </TouchableOpacity>

                                {item.status === "completed" && (
                                    <TouchableOpacity
                                        onPress={() => openReview(item)}
                                        className="bg-emerald-600 px-4 py-2 rounded-xl"
                                    >
                                        <Text className="text-white font-Jost-Bold">
                                            Rate & Review
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Text className="text-gray-500">
                                No bookings found.
                            </Text>
                        </View>
                    }
                />
            )}

        </View>
    );
}
