import { useEffect, useState } from "react";

import {
    View,
    Text,
    Alert,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

import Input from "@/components/ui/Input";

import Button from "@/components/ui/Button";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { verifyFaces } from "@/services/verification.service";

const VERIFICATION_BUCKET = "national-registry";

const normalizeNationalId = (value: string) => value.replace(/\s+/g, "").trim();

const maskNationalId = (value: string) => {
    if (!value) return "";
    if (value.length <= 4) return value;
    return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

export default function VerificationScreen() {
    const { user } = useAuth();

    const [nationalId, setNationalId] = useState("");

    const [imageUri, setImageUri] = useState("");

    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState<string>("not_submitted");

    const loadExistingVerification = async () => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from("user_verifications")
            .select("verification_status")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!error && data?.verification_status) {
            setStatus(data.verification_status);
        }
    };

    useEffect(() => {
        loadExistingVerification();
    }, [user?.id]);

    const pickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestCameraPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permission Required",
                    "Camera permission is required",
                );

                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.35,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleVerification = async () => {
        try {
            const normalizedNationalId = normalizeNationalId(nationalId);

            if (!normalizedNationalId) {
                return Alert.alert(
                    "Validation Error",
                    "National ID is required",
                );
            }

            if (!imageUri) {
                return Alert.alert(
                    "Validation Error",
                    "Please capture a selfie",
                );
            }

            if (!user) {
                return Alert.alert("Authentication Error", "User not found");
            }

            setLoading(true);
            setStatus("pending");

            // Refresh session to ensure JWT is valid
            const { error: refreshError } =
                await supabase.auth.refreshSession();
            if (refreshError) {
                throw new Error("Session expired. Please log in again.");
            }

            const { matched, similarityScore } = await verifyFaces({
                selfieUri: imageUri,
                nationalId: normalizedNationalId,
                userId: user.id,
            });

            const fileResponse = await fetch(imageUri);
            const selfieBlob = await fileResponse.blob();

            const filePath = `${user.id}/verifications/${Date.now()}-selfie.jpg`;

            const { error: uploadError } = await supabase.storage
                .from(VERIFICATION_BUCKET)
                .upload(filePath, selfieBlob, {
                    contentType: "image/jpeg",
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            const { data: registryCitizen, error: registryLookupError } =
                await supabase
                    .from("national_registry")
                    .select("id")
                    .eq("national_id_number", normalizedNationalId)
                    .single();

            if (registryLookupError) {
                throw new Error(registryLookupError.message);
            }

            const { error: verificationInsertError } = await supabase
                .from("user_verifications")
                .upsert(
                    {
                        user_id: user.id,
                        national_registry_id: registryCitizen.id,
                        verification_status: "pending",
                        similarity_score: similarityScore,
                        verified_at: null,
                    },
                    { onConflict: "user_id" },
                );

            if (verificationInsertError) {
                throw new Error(verificationInsertError.message);
            }

            const { error: profileUpdateError } = await supabase
                .from("profiles")
                .update({
                    verification_status: "pending",
                    is_verified: false,
                })
                .eq("id", user.id);

            if (profileUpdateError) {
                throw new Error(profileUpdateError.message);
            }

            await loadExistingVerification();

            Alert.alert(
                "Verification Submitted",
                `Pre-check score: ${similarityScore.toFixed(2)}%. Submitted for admin review.`,
            );
        } catch (error: any) {
            Alert.alert("Verification Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setNationalId("");
        setImageUri("");
    };

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold">
                Identity Verification
            </Text>

            <Text className="text-gray-500 mt-2">
                Verify your identity using your National ID and a selfie.
            </Text>

            <View className="mt-4 self-start px-3 py-1 rounded-full bg-gray-100">
                <Text className="text-gray-700 font-Jost-Medium capitalize">
                    Status: {status.replace("_", " ")}
                </Text>
            </View>

            <View className="mt-8">
                <Input
                    label="National ID Number"
                    placeholder="Enter National ID Number"
                    value={nationalId}
                    onChangeText={setNationalId}
                />
            </View>

            <View className="mt-6">
                <Text className="font-Jost-Bold text-base mb-3">
                    Selfie Verification
                </Text>

                <TouchableOpacity
                    onPress={pickImage}
                    className="border-2 border-dashed border-primary rounded-full h-64 w-full self-center items-center justify-center overflow-hidden"
                >
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            className="w-full h-full rounded-full"
                        />
                    ) : (
                        <View className="items-center">
                            <Ionicons
                                name="camera"
                                size={60}
                                color="#2a6ff2ff"
                            />

                            <Text className="mt-3 text-gray-500">
                                Tap to capture selfie
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View className="mt-8 pb-10">
                {loading ? (
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#2a6ff2ff" />

                        <Text className="mt-4 text-gray-500">
                            Verifying identity...
                        </Text>
                    </View>
                ) : (
                    <>
                        <Button
                            title="Verify Identity"
                            onPress={handleVerification}
                        />

                        <TouchableOpacity
                            onPress={handleClear}
                            className="mt-4 items-center"
                        >
                            <Text className="text-primary font-Jost-Medium">
                                Clear
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </ScrollView>
    );
}
