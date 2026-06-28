import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerBookings } from "@/services/job.service";

const historyFilters = ["all", "completed", "cancelled"];

export default function CustomerHistoryScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const load = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const data = await getCustomerBookings(user.id, "all");
                const done = (data || []).filter((job: any) =>
                    ["completed", "cancelled"].includes(job.status),
                );
                setHistory(done);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [user?.id]);

    const filteredHistory = useMemo(() => {
        if (filter === "all") return history;
        return history.filter((item) => item.status === filter);
    }, [history, filter]);

    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-4">History</Text>

            <FlatList
                horizontal
                data={historyFilters}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                className="mb-4 max-h-12"
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setFilter(item)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                            filter === item ? "bg-primary" : "bg-gray-100"
                        }`}
                    >
                        <Text
                            className={`${
                                filter === item ? "text-white" : "text-gray-700"
                            } font-Jost-Medium`}
                        >
                            {item.charAt(0).toUpperCase() + item.slice(1)}
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
                    data={filteredHistory}
                    keyExtractor={(item) => item.id}
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
                                Status: {item.status}
                            </Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center mt-16">
                            <Text className="text-gray-500">
                                No history records yet.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
