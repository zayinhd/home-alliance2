import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getAdminJobs } from "@/services/admin.service";

const statusFilters = ["all", "pending", "accepted", "completed", "cancelled"];

export default function AdminJobsScreen() {
    const params = useLocalSearchParams<{ status?: string }>();
    const [jobs, setJobs] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadJobs();
    }, [status]);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const data = await getAdminJobs(status);
            const filtered = (data || []).filter((job: any) => {
                const query = search.toLowerCase();
                return (
                    !query ||
                    `${job.service || ""} ${job.customer?.username || ""} ${job.contractor?.username || ""}`
                        .toLowerCase()
                        .includes(query)
                );
            });
            setJobs(filtered);
        } catch (error) {
            console.warn("Failed to load jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, [search]);

    useEffect(() => {
        if (params.status && statusFilters.includes(params.status)) {
            setStatus(params.status);
        }
    }, [params.status]);

    return (
        <View className="flex bg-white px-4 pt-14">
            <Text className="text-3xl font-Jost-Bold mb-4">Jobs Overview</Text>

            <TextInput
                placeholder="Search jobs"
                value={search}
                onChangeText={setSearch}
                className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
            />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
            >
                {statusFilters.map((item) => (
                    <TouchableOpacity
                        key={item}
                        onPress={() => setStatus(item)}
                        className={`px-4 py-2 rounded-full h-10   mr-2 ${
                            status === item ? "bg-primary" : "bg-gray-100"
                        }`}
                    >
                        <Text
                            className={`${
                                status === item ? "text-white" : "text-gray-700"
                            } font-Jost-Medium`}
                        >
                            {item === "all"
                                ? "All"
                                : item.charAt(0).toUpperCase() + item.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View className="flex items-center justify-center">
                    <ActivityIndicator size="large" color="#2a6ff2ff" />
                </View>
            ) : (
                <View className="flex rounded-2xl border border-gray-200 overflow-hidden">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View>
                            <View className="flex-row bg-gray-100 px-3 py-3">
                                <Text className="w-44 font-Jost-Bold">
                                    Service
                                </Text>
                                <Text className="w-44 font-Jost-Bold">
                                    Customer
                                </Text>
                                <Text className="w-44 font-Jost-Bold">
                                    Provider
                                </Text>
                                <Text className="w-28 font-Jost-Bold">
                                    Budget
                                </Text>
                                <Text className="w-28 font-Jost-Bold">
                                    Status
                                </Text>
                            </View>

                            <FlatList
                                data={jobs}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                                renderItem={({ item }) => (
                                    <View className="flex-row px-3 py-3 border-b border-gray-100">
                                        <Text
                                            className="w-44"
                                            numberOfLines={2}
                                        >
                                            {item.service || "—"}
                                        </Text>
                                        <Text
                                            className="w-44"
                                            numberOfLines={2}
                                        >
                                            {item.customer?.username || "—"}
                                        </Text>
                                        <Text
                                            className="w-44"
                                            numberOfLines={2}
                                        >
                                            {item.contractor?.username || "—"}
                                        </Text>
                                        <Text
                                            className="w-28"
                                            numberOfLines={2}
                                        >
                                            Ghc {item.budget || 0}
                                        </Text>
                                        <Text
                                            className="w-28"
                                            numberOfLines={2}
                                        >
                                            {item.status || "—"}
                                        </Text>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View className="px-3 py-6">
                                        <Text className="text-gray-500">
                                            No jobs found.
                                        </Text>
                                    </View>
                                }
                            />
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
}
