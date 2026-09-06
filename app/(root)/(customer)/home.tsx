import { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import LiveMap from "@/components/map/LiveMap";

import ProtectedRoute from "@/components/feature/ProtectedRoute";
import { getContractors } from "@/services/contractor.service";

const renderStars = (value: number, size = 16) => {
    const safeValue = Number(value) || 0;
    const roundedValue = Math.round(safeValue);

    return (
        <View className="flex-row items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= roundedValue ? "star" : "star-outline"}
                    size={size}
                    color={star <= roundedValue ? "#fbbf24" : "#d1d5db"}
                    style={{ marginRight: 2 }}
                />
            ))}
        </View>
    );
};

export default function CustomerHomeScreen() {
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState<any[]>([]);

    const loadProviders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getContractors();
            setProviders(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProviders();
    }, [loadProviders]);

    useFocusEffect(
        useCallback(() => {
            loadProviders();
        }, [loadProviders]),
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <View className="flex-1 bg-white">
                {/* HEADER */}

                <View className="px-6 pt-16 pb-4">
                    <Text className="text-3xl font-Jost-Bold">
                        Customer Home
                    </Text>

                    <Text className="text-gray-500 mt-1">
                        Find nearby contractors
                    </Text>
                </View>

                {/* MAP */}

                <View className="h-[46%] px-6 pb-3">
                    <LiveMap />
                </View>

                {/* NEARBY CONTRACTORS */}

                <View className="flex-1 px-6 pt-5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-Jost-Bold">
                            Nearby Service Providers
                        </Text>

                        <TouchableOpacity
                            onPress={() =>
                                router.push("/(root)/(customer)/discover")
                            }
                        >
                            <Text className="text-primary font-Jost-Medium">
                                View All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={providers.slice(0, 8)}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname:
                                            "/(root)/(customer)/contractor-profile",
                                        params: {
                                            id: item.id,
                                            name: item.username,
                                            profession: item.profession,
                                            rating: item.rating,
                                        },
                                    })
                                }
                                className="bg-gray-100 rounded-2xl p-5 mb-4"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
                                            <Text className="text-white font-Jost-Bold text-lg">
                                                {item.username
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </Text>
                                        </View>

                                        <View className="ml-4">
                                            <Text className="text-lg font-Jost-Bold">
                                                {item.username}
                                            </Text>

                                            <Text className="text-gray-500 mt-1">
                                                {item.profession}
                                            </Text>

                                            <View className="flex-row items-center mt-2">
                                                {renderStars(Number(item.rating) || 0, 15)}
                                                <Text className="ml-2 text-gray-600 font-Jost-Medium">
                                                    {Number(item.rating || 0).toFixed(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <Ionicons
                                        name="chevron-forward"
                                        size={22}
                                        color="#999"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push({
                                            pathname:
                                                "/(root)/(customer)/contractor-profile",
                                            params: {
                                                id: item.id,
                                            },
                                        })
                                    }
                                    className="bg-primary py-3 rounded-2xl items-center mt-4"
                                >
                                    <Text className="text-white font-Jost-Bold">
                                        Book Now
                                    </Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </ProtectedRoute>
    );
}
