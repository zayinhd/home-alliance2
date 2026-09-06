import { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { submitJobReview } from "@/services/job.service";

export default function ReviewJobScreen() {
    const { user } = useAuth();
    const { job } = useLocalSearchParams<{ job?: string }>();
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    const selectedJob = useMemo(() => {
        if (!job) return null;

        try {
            return JSON.parse(job);
        } catch (error) {
            return null;
        }
    }, [job]);

    const handleSubmit = async () => {
        if (!user?.id || !selectedJob?.service_provider_id) {
            Alert.alert("Error", "Missing booking information.");
            return;
        }

        try {
            setSubmitting(true);
            await submitJobReview(
                user.id,
                selectedJob.service_provider_id,
                rating,
                comment.trim(),
            );
            Alert.alert("Success", "Review submitted.");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to submit review.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!selectedJob) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-lg font-Jost-Bold text-gray-700">
                    Review details not available.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-4 bg-primary px-5 py-3 rounded-2xl"
                >
                    <Text className="text-white font-Jost-Bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white px-5 pt-14">
            <TouchableOpacity
                onPress={() => router.back()}
                className="mb-4 self-start"
            >
                <Text className="text-primary font-Jost-Bold">Back</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-3xl font-Jost-Bold mb-2">
                    Leave a Review
                </Text>
                <Text className="text-gray-600 mb-6">
                    How was your experience with {selectedJob.service || "this service"}?
                </Text>

                <View className="bg-gray-100 rounded-3xl p-5 mb-6">
                    <Text className="text-lg font-Jost-Bold">
                        {selectedJob.service || "Service"}
                    </Text>
                    <Text className="text-gray-600 mt-1">
                        Provider: {selectedJob.service_provider?.username || "—"}
                    </Text>
                </View>

                <View className="items-center mb-6">
                    <Text className="text-base font-Jost-Medium text-gray-700 mb-3">
                        Your rating
                    </Text>
                    <View className="flex-row justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                className="mx-1"
                            >
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={36}
                                    color={star <= rating ? "#fbbf24" : "#d1d5db"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <Text className="text-base font-Jost-Medium text-gray-700 mb-2">
                    Tell us more
                </Text>
                <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Write your review..."
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    className="border border-gray-300 rounded-2xl px-4 py-3 h-32 mb-6"
                />

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    className="bg-primary rounded-2xl py-4 items-center"
                >
                    <Text className="text-white text-base font-Jost-Bold">
                        {submitting ? "Submitting..." : "Submit Review"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
