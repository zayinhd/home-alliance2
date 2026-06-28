import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
    getContractorById,
    getContractorReviews,
} from "@/services/contractor.service";
import { createBooking } from "@/services/job.service";

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

    useEffect(() => {
        const load = async () => {
            if (!id) return;

            try {
                const [provider, providerReviews] = await Promise.all([
                    getContractorById(id),
                    getContractorReviews(id),
                ]);

                setProfile(provider);
                setReviews(providerReviews || []);
            } catch (error: any) {
                Alert.alert(
                    "Error",
                    error.message || "Unable to load provider.",
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

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
                <Text className="text-white/80 mt-2">
                    Rating: {profile?.rating || 0} (
                    {profile?.reviews_count || 0} reviews)
                </Text>
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
                        <Text className="text-gray-700 mt-1">
                            Rating: {item.rating || 0}/5
                        </Text>
                        <Text className="text-gray-500 mt-1">
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
