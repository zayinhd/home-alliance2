import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
    getContractorById,
    getContractorReviews,
} from "@/services/contractor.service";
import { createBooking } from "@/services/job.service";
import { Ionicons } from "@expo/vector-icons";

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

export default function CustomerContractorProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);

    const [service, setService] = useState("");
    const [budget, setBudget] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");

    const load = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [provider, providerReviews] = await Promise.all([
                getContractorById(id),
                getContractorReviews(id),
            ]);

            setProfile(provider);
            setReviews(providerReviews || []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to load provider.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const handleBook = async () => {
        if (!user?.id || !id) return;

        if (!service.trim() || !budget.trim()) {
            Alert.alert("Missing details", "Service and budget are required.");
            return;
        }

        try {
            setBooking(true);
            await createBooking({
                customerId: user.id,
                serviceProviderId: id,
                service: service.trim(),
                budget: Number(budget) || 0,
                location: location.trim(),
                description: description.trim(),
            });

            Alert.alert("Success", "Booking request sent to provider.");
            setService("");
            setBudget("");
            setLocation("");
            setDescription("");
            router.push("/(root)/(customer)/jobs");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to create booking.");
        } finally {
            setBooking(false);
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
        <ScrollView className="flex-1 bg-white px-6 pt-14">
            <View className="bg-primary rounded-3xl p-6 mb-6">
                <Text className="text-white text-2xl font-Jost-Bold">
                    {profile?.username || "Service Provider"}
                </Text>
                <Text className="text-white/80 mt-1">
                    {Array.isArray(profile?.professions)
                        ? profile.professions.join(", ")
                        : profile?.professions ||
                          profile?.profession ||
                          "General Services"}
                </Text>
                <View className="flex-row items-center mt-3">
                    {renderStars(Number(profile?.rating) || 0, 18)}
                    <Text className="text-white ml-2 font-Jost-Bold">
                        {Number(profile?.rating || 0).toFixed(1)}
                    </Text>
                    <Text className="text-white/80 ml-2">
                        ({profile?.reviews_count || 0} reviews)
                    </Text>
                </View>
            </View>

            <Text className="text-xl font-Jost-Bold mb-3">
                Book This Provider
            </Text>
            <Input
                label="Service"
                placeholder="e.g. Plumbing repair"
                value={service}
                onChangeText={setService}
            />
            <Input
                label="Budget (Ghc)"
                placeholder="e.g. 120"
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
            />
            <Input
                label="Location"
                placeholder="Enter service address"
                value={location}
                onChangeText={setLocation}
            />
            <Input
                label="Description"
                placeholder="Describe the issue"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <Button
                title="Send Booking Request"
                onPress={handleBook}
                loading={booking}
            />

            <Text className="text-xl font-Jost-Bold mt-8 mb-3">
                Customer Reviews
            </Text>
            <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                    <View className="bg-gray-100 rounded-2xl p-4 mb-3">
                        <Text className="font-Jost-Bold">
                            {item.customer?.username || "Customer"}
                        </Text>

                        <View className="flex-row items-center mt-2">
                            {renderStars(Number(item.rating) || 0, 16)}
                            <Text className="ml-2 text-gray-700 font-Jost-Medium">
                                {Number(item.rating || 0).toFixed(1)}/5
                            </Text>
                        </View>

                        <Text className="text-gray-500 mt-2">
                            {item.comment || "No comment"}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text className="text-gray-500 mb-10">No reviews yet.</Text>
                }
            />

            <TouchableOpacity
                onPress={() => router.push("/(root)/(customer)/tracking")}
                className="border border-primary py-4 rounded-2xl items-center mb-12"
            >
                <Text className="text-primary font-Jost-Bold">
                    Track Live Location
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
