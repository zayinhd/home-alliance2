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
import {
    getServiceProviderBookings,
    updateJobStatus,
} from "@/services/job.service";

const statusFilters = [
    "all",
    "pending",
    "accepted",
    "in_progress",
    "completed",
    "cancelled",
];

export default function ContractorJobsScreen() {
    const { user } = useAuth();
    const [status, setStatus] = useState("all");
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        loadJobs();
    }, [user?.id, status]);

    const loadJobs = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const data = await getServiceProviderBookings(user.id, status);
            setJobs(data || []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (jobId: string, nextStatus: any) => {
        try {
            setUpdatingId(jobId);
            await updateJobStatus(jobId, nextStatus);
            await loadJobs();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to update booking.");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <View className="flex-1 bg-white px-4 pt-14">
            <Text className="text-3xl font-Jost-Bold mb-4">
                Booking Requests
            </Text>

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
                            className={`${status === item ? "text-white" : "text-gray-700"} font-Jost-Medium`}
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
                    renderItem={({ item }) => (
                        <View className="bg-gray-100 rounded-2xl p-5 mb-4">
                            <Text className="text-lg font-Jost-Bold">
                                {item.service}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Customer: {item.customer?.username || "—"}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Budget: Ghc {item.budget || 0}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Status: {item.status}
                            </Text>

                            <View className="flex-row flex-wrap mt-4">
                                {item.status === "pending" && (
                                    <>
                                        <TouchableOpacity
                                            disabled={updatingId === item.id}
                                            onPress={() =>
                                                handleStatusChange(
                                                    item.id,
                                                    "accepted",
                                                )
                                            }
                                            className="bg-primary px-4 py-2 rounded-xl mr-2 mb-2"
                                        >
                                            <Text className="text-white font-Jost-Bold">
                                                Accept
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            disabled={updatingId === item.id}
                                            onPress={() =>
                                                handleStatusChange(
                                                    item.id,
                                                    "cancelled",
                                                )
                                            }
                                            className="bg-red-500 px-4 py-2 rounded-xl mr-2 mb-2"
                                        >
                                            <Text className="text-white font-Jost-Bold">
                                                Cancel
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {item.status === "accepted" && (
                                    <TouchableOpacity
                                        disabled={updatingId === item.id}
                                        onPress={() =>
                                            handleStatusChange(
                                                item.id,
                                                "in_progress",
                                            )
                                        }
                                        className="bg-amber-500 px-4 py-2 rounded-xl mr-2 mb-2"
                                    >
                                        <Text className="text-white font-Jost-Bold">
                                            Start Job
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {(item.status === "accepted" ||
                                    item.status === "in_progress") && (
                                    <TouchableOpacity
                                        disabled={updatingId === item.id}
                                        onPress={() =>
                                            handleStatusChange(
                                                item.id,
                                                "completed",
                                            )
                                        }
                                        className="bg-emerald-600 px-4 py-2 rounded-xl mr-2 mb-2"
                                    >
                                        <Text className="text-white font-Jost-Bold">
                                            Mark Complete
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/(root)/(contractor)/tracking",
                                        )
                                    }
                                    className="border border-primary px-4 py-2 rounded-xl mb-2"
                                >
                                    <Text className="text-primary font-Jost-Bold">
                                        Track Customer
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center mt-16">
                            <Text className="text-gray-500">
                                No bookings yet.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
