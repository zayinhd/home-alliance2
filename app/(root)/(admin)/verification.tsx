import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
    approveVerification,
    deleteVerificationRequest,
    getVerificationRequests,
    rejectVerification,
} from "@/services/admin.service";
import { supabase } from "@/lib/supabase";

const statusFilters = ["pending", "failed", "verified", "all"];

const getStatusChipClass = (status?: string) => {
    if (status === "verified") return "bg-emerald-100 text-emerald-700";
    if (status === "failed") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
};

const toTitleCase = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

export default function AdminVerificationScreen() {
    const params = useLocalSearchParams<{ status?: string }>();
    const [requests, setRequests] = useState<any[]>([]);
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (params.status && statusFilters.includes(params.status)) {
            setStatus(params.status);
        }
    }, [params.status]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await getVerificationRequests(status);
            setRequests(data || []);
        } catch (error) {
            console.warn("Failed to load verification requests", error);
            Alert.alert(
                "Unable to load",
                "Could not fetch verification requests.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [status]);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [status]),
    );

    useEffect(() => {
        const channel = supabase.channel("admin-verification-requests");

        channel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "user_verifications",
            },
            () => {
                loadRequests();
            },
        );

        channel.on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
            },
            () => {
                loadRequests();
            },
        );

        channel.subscribe();

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [status]);

    const handleApprove = (item: any) => {
        Alert.alert(
            "Approve Verification",
            `Approve ${item?.profile?.username || "this provider"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: async () => {
                        try {
                            setProcessingId(item.id);
                            await approveVerification(item.id, item.profile.id);
                            await loadRequests();
                        } catch (error: any) {
                            Alert.alert(
                                "Approval failed",
                                error?.message || "Could not approve request.",
                            );
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ],
        );
    };

    const handleReject = (item: any) => {
        Alert.alert(
            "Reject Verification",
            `Reject ${item?.profile?.username || "this provider"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setProcessingId(item.id);
                            await rejectVerification(item.id, item.profile.id);
                            await loadRequests();
                        } catch (error: any) {
                            Alert.alert(
                                "Rejection failed",
                                error?.message || "Could not reject request.",
                            );
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ],
        );
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            "Delete Verification Request",
            `Delete ${item?.profile?.username || "this provider"}'s verification request?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setProcessingId(item.id);
                            await deleteVerificationRequest(
                                item.id,
                                item.profile.id,
                            );
                            await loadRequests();
                        } catch (error: any) {
                            Alert.alert(
                                "Delete failed",
                                error?.message || "Could not delete request.",
                            );
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ],
        );
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                className="flex-1 px-4 pt-14"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-3xl font-Jost-Bold mb-3">
                    Verification Requests
                </Text>

                <Text className="text-gray-500 mb-4">
                    Compare provider selfie with the national registry image and
                    approve or reject requests.
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                >
                    {statusFilters.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setStatus(item)}
                            className={`h-10 px-4 py-2 rounded-full mr-2 items-center justify-center ${
                                status === item ? "bg-primary" : "bg-gray-100"
                            }`}
                        >
                            <Text
                                className={`${
                                    status === item
                                        ? "text-white"
                                        : "text-gray-700"
                                } font-Jost-Medium`}
                            >
                                {toTitleCase(item)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading ? (
                    <View className="py-10 items-center justify-center">
                        <ActivityIndicator size="large" color="#2a6ff2ff" />
                    </View>
                ) : requests.length === 0 ? (
                    <View className="rounded-2xl border border-gray-200 p-5">
                        <Text className="text-gray-500">
                            No verification requests found.
                        </Text>
                    </View>
                ) : (
                    requests.map((item) => {
                        const statusChipClass = getStatusChipClass(
                            item.verification_status,
                        );
                        const similarityValue = Number(
                            item?.similarity_score ?? 0,
                        );
                        const similarityText =
                            Number.isFinite(similarityValue) && similarityValue > 0
                                ? `${similarityValue.toFixed(2)}%`
                                : "Not available";

                        return (
                            <View
                                key={item.id}
                                className="rounded-2xl border border-gray-200 p-4 mb-4"
                            >
                                <View className="flex-row items-center justify-between mb-3">
                                    <Text className="text-lg font-Jost-Bold">
                                        {item?.profile?.username ||
                                            "Unknown user"}
                                    </Text>
                                    <Text
                                        className={`px-3 py-1 rounded-full capitalize ${statusChipClass}`}
                                    >
                                        {item.verification_status || "pending"}
                                    </Text>
                                </View>

                                <Text className="text-gray-700 mb-1">
                                    Email: {item?.profile?.email || "-"}
                                </Text>
                                <Text className="text-gray-700 mb-1">
                                    Phone: {item?.profile?.phone || "-"}
                                </Text>
                                <Text className="text-gray-700 mb-1">
                                    Registry Name:{" "}
                                    {item?.registry?.full_name || "-"}
                                </Text>
                                <Text className="text-gray-700 mb-1">
                                    National ID:{" "}
                                    {item?.registry?.national_id_number || "-"}
                                </Text>
                                <Text className="text-gray-700 mb-3">
                                    Similarity: {similarityText}
                                </Text>

                                <Text className="font-Jost-Bold mb-2">
                                    Image Comparison
                                </Text>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                >
                                    <View className="mr-3">
                                        <Text className="text-gray-600 mb-1">
                                            Provider Selfie
                                        </Text>
                                        {item?.providerSelfieUrl ? (
                                            <Image
                                                source={{
                                                    uri: item.providerSelfieUrl,
                                                }}
                                                className="w-40 h-40 rounded-2xl bg-gray-100"
                                            />
                                        ) : (
                                            <View className="w-40 h-40 rounded-2xl bg-gray-100 items-center justify-center">
                                                <Text className="text-gray-500 text-center px-2">
                                                    No uploaded selfie found
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View>
                                        <Text className="text-gray-600 mb-1">
                                            Registry Image
                                        </Text>
                                        {item?.registry?.photo_url ? (
                                            <Image
                                                source={{
                                                    uri: item.registry
                                                        .photo_url,
                                                }}
                                                className="w-40 h-40 rounded-2xl bg-gray-100"
                                            />
                                        ) : (
                                            <View className="w-40 h-40 rounded-2xl bg-gray-100 items-center justify-center">
                                                <Text className="text-gray-500 text-center px-2">
                                                    Registry image missing
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>

                                <View className="flex-row mt-4 flex-wrap">
                                    <TouchableOpacity
                                        onPress={() => handleApprove(item)}
                                        disabled={
                                            processingId === item.id ||
                                            item.verification_status ===
                                                "verified"
                                        }
                                        className="bg-emerald-600 px-4 py-2 rounded-full mr-2 mb-2"
                                    >
                                        <Text className="text-white font-Jost-Medium">
                                            Approve
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleReject(item)}
                                        disabled={
                                            processingId === item.id ||
                                            item.verification_status ===
                                                "failed"
                                        }
                                        className="bg-red-600 px-4 py-2 rounded-full mr-2 mb-2"
                                    >
                                        <Text className="text-white font-Jost-Medium">
                                            Reject
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleDelete(item)}
                                        disabled={processingId === item.id}
                                        className="bg-gray-700 px-4 py-2 rounded-full mb-2"
                                    >
                                        <Text className="text-white font-Jost-Medium">
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}
