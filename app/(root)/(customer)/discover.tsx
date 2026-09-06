import { useCallback, useEffect, useState } from "react";

import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

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

const categories = [
    "Electrician",
    "Plumber",
    "Cleaner",
    "Painter",
    "Carpenter",
    "Mechanic",
];

export default function DiscoverScreen() {
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [contractors, setContractors] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState("");

    const fetchContractors = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getContractors();

            setContractors(data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContractors();
    }, [fetchContractors]);

    useFocusEffect(
        useCallback(() => {
            fetchContractors();
        }, [fetchContractors]),
    );

    const filteredContractors = contractors.filter((contractor) => {
        const matchesSearch =
            contractor.username?.toLowerCase().includes(search.toLowerCase()) ||
            contractor.profession?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            selectedCategory === ""
                ? true
                : contractor.profession === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-6">Discover</Text>

            {/* SEARCH BAR */}

            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-5">
                <Ionicons name="search" size={20} color="#999" />

                <TextInput
                    placeholder="Search service providers..."
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={setSearch}
                    className="flex-1 ml-3 text-base"
                />
            </View>

            {/* CATEGORIES */}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2 pb-4"
            >
                <TouchableOpacity
                    onPress={() => setSelectedCategory("")}
                    className={`h-10 px-5 py-3 rounded-2xl mr-3 ${
                        selectedCategory === "" ? "bg-primary" : "bg-gray-200"
                    }`}
                >
                    <Text
                        className={`font-Jost-Medium ${
                            selectedCategory === ""
                                ? "text-white"
                                : "text-black"
                        }`}
                    >
                        All
                    </Text>
                </TouchableOpacity>

                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        className={`h-10 px-5 py-3 rounded-2xl mr-3 ${
                            selectedCategory === category
                                ? "bg-primary"
                                : "bg-gray-200"
                        }`}
                    >
                        <Text
                            className={`font-Jost-Medium ${
                                selectedCategory === category
                                    ? "text-white"
                                    : "text-black"
                            }`}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* CONTRACTORS */}

            <FlatList
                data={filteredContractors}
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
                                },
                            })
                        }
                        className="mt-4bg-gray-100 p-5 rounded-2xl mb-4"
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
                                    <Text className="text-white font-Jost-Bold text-lg">
                                        {item.username
                                            ?.substring(0, 2)
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
                                            {Number(item.rating || 0).toFixed(1)} ({item.reviews_count || 0}{" "}
                                            reviews)
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#999"
                            />
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <Text className="text-gray-500 text-base">
                            No contractors found
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
