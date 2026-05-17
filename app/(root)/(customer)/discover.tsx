import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";

const contractors = [
    {
        id: "1",
        name: "John Electric",
        profession: "Electrician",
    },
    {
        id: "2",
        name: "Mike Plumbing",
        profession: "Plumber",
    },
    {
        id: "3",
        name: "Sarah Cleaning",
        profession: "Cleaner",
    },
    {
        id: "4",
        name: "Bright Paints",
        profession: "Painter",
    },
];

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

    const [selectedCategory, setSelectedCategory] = useState("");

    const filteredContractors = contractors.filter((contractor) => {
        const matchesSearch =
            contractor.name.toLowerCase().includes(search.toLowerCase()) ||
            contractor.profession.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            selectedCategory === ""
                ? true
                : contractor.profession === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-6">Discover</Text>

            {/* SEARCH BAR */}

            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-5">
                <Ionicons name="search" size={20} color="#999" />

                <TextInput
                    placeholder="Search contractors..."
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={setSearch}
                    className="flex-1 ml-3 text-base"
                />
            </View>

            {/* CATEGORY SUGGESTIONS */}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
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
                    <TouchableOpacity className="bg-gray-100 p-5 rounded-2xl mb-4">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-lg font-Jost-Bold">
                                    {item.name}
                                </Text>

                                <Text className="text-gray-500 mt-1">
                                    {item.profession}
                                </Text>
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
