import { View, Text, FlatList, TouchableOpacity } from "react-native";

import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import LiveMap from "@/components/map/LiveMap";

import ProtectedRoute from "@/components/feature/ProtectedRoute";

const nearbyContractors = [
    {
        id: "1",
        name: "John Electric",
        profession: "Electrician",
        rating: "4.9",
    },
    {
        id: "2",
        name: "Mike Plumbing",
        profession: "Plumber",
        rating: "4.7",
    },
    {
        id: "3",
        name: "Sarah Cleaning",
        profession: "Cleaner",
        rating: "4.8",
    },
];

export default function CustomerHomeScreen() {
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

                <View className="h-[40%]">
                    <LiveMap />
                </View>

                {/* NEARBY CONTRACTORS */}

                <View className="flex-1 px-6 pt-5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-Jost-Bold">
                            Nearby Contractors
                        </Text>

                        <TouchableOpacity>
                            <Text className="text-primary font-Jost-Medium">
                                View All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={nearbyContractors}
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
                                            name: item.name,
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
                                                {item.name
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </Text>
                                        </View>

                                        <View className="ml-4">
                                            <Text className="text-lg font-Jost-Bold">
                                                {item.name}
                                            </Text>

                                            <Text className="text-gray-500 mt-1">
                                                {item.profession}
                                            </Text>

                                            <View className="flex-row items-center mt-2">
                                                <Ionicons
                                                    name="star"
                                                    size={16}
                                                    color="#f29f05ff"
                                                />

                                                <Text className="ml-1 text-gray-600">
                                                    {item.rating}
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
                                        Request Job
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
