import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerBookings, submitJobReview } from "@/services/job.service";

const statusFilters = [
    "all",
    "pending",
    "accepted",
    "in_progress",
    "completed",
    "cancelled",
];

export default function CustomerJobsScreen() {
    const { user } = useAuth();

    const [jobs, setJobs] = useState<any[]>([]);
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [rating, setRating] = useState("5");
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadJobs();
    }, [user?.id, status]);

    const loadJobs = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const data = await getCustomerBookings(user.id, status);
            setJobs(data || []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    const openReview = (job: any) => {
        setSelectedJob(job);
        setRating("5");
        setComment("");
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!user?.id || !selectedJob?.service_provider_id) return;

        try {
            setSubmittingReview(true);
            await submitJobReview(
                user.id,
                selectedJob.service_provider_id,
                Number(rating) || 5,
                comment.trim(),
            );
            Alert.alert("Success", "Review submitted.");
            setShowReviewModal(false);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <View className="flex-1 bg-white px-4 pt-14">
            <Text className="text-3xl font-Jost-Bold mb-4">My Bookings</Text>

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
                            className={`font-Jost-Medium ${
                                status === item ? "text-white" : "text-gray-700"
                            }`}
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
                    showsVerticalScrollIndicator={false}
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
                                Status: {item.status || "—"}
                            </Text>

                            <View className="flex-row mt-4">
                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/(root)/(customer)/tracking",
                                        )
                                    }
                                    className="bg-primary px-4 py-2 rounded-xl mr-2"
                                >
                                    <Text className="text-white font-Jost-Bold">
                                        Track
                                    </Text>
                                </TouchableOpacity>

                                {item.status === "completed" && (
                                    <TouchableOpacity
                                        onPress={() => openReview(item)}
                                        className="bg-emerald-600 px-4 py-2 rounded-xl"
                                    >
                                        <Text className="text-white font-Jost-Bold">
                                            Rate & Review
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Text className="text-gray-500">
                                No bookings found.
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal visible={showReviewModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl p-5">
                        <Text className="text-xl font-Jost-Bold mb-4">
                            Leave a Review
                        </Text>
                        <TextInput
                            placeholder="Rating (1-5)"
                            keyboardType="numeric"
                            value={rating}
                            onChangeText={setRating}
                            className="border border-gray-300 rounded-2xl px-4 py-3 mb-3"
                        />
                        <TextInput
                            placeholder="Write your review"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={4}
                            className="border border-gray-300 rounded-2xl px-4 py-3 mb-4"
                        />
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setShowReviewModal(false)}
                                className="flex-1 border border-gray-300 rounded-2xl py-3 mr-2 items-center"
                            >
                                <Text className="font-Jost-Bold text-gray-700">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmitReview}
                                disabled={submittingReview}
                                className="flex-1 bg-primary rounded-2xl py-3 items-center"
                            >
                                <Text className="font-Jost-Bold text-white">
                                    {submittingReview
                                        ? "Submitting..."
                                        : "Submit"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
