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
import { verifyFaces } from "../../../services/verification.service";

const VERIFICATION_BUCKET = "national-registry";

const normalizeNationalId = (value: string) => value.replace(/\s+/g, "").trim();

const maskNationalId = (value: string) => {
    if (!value) return "";
    if (value.length <= 4) return value;
    return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

const formatSupabaseError = (error: any) => ({
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
});

export default function VerificationScreen() {
    const { user } = useAuth();

    const [nationalId, setNationalId] = useState("");

    const [imageUri, setImageUri] = useState("");

    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState<string>("not_submitted");

    const loadExistingVerification = async () => {
        if (!user?.id) return;

        console.log("[verification] loadExistingVerification:start", {
            userId: user.id,
        });

        const { data, error } = await supabase
            .from("user_verifications")
            .select("verification_status")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error(
                "[verification] loadExistingVerification:error",
                formatSupabaseError(error),
            );
        } else {
            console.log("[verification] loadExistingVerification:success", {
                status: data?.verification_status ?? "not_submitted",
            });
        }

        if (data?.verification_status) {
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
                quality: 0.8,
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

            console.log("[verification] handleVerification:start", {
                userId: user?.id,
                hasImage: Boolean(imageUri),
                nationalId: maskNationalId(normalizedNationalId),
            });

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

            // Refresh session to ensure JWT is valid
            const { error: refreshError } =
                await supabase.auth.refreshSession();
            if (refreshError) {
                console.error(
                    "[verification] refreshSession:error",
                    formatSupabaseError(refreshError),
                );
                throw new Error("Session expired. Please log in again.");
            }

            console.log("[verification] refreshSession:success");

            const { data: registry, error: registryLookupError } =
                await supabase
                    .from("national_registry")
                    .select("id, national_id_number, photo_url")
                    .eq("national_id_number", normalizedNationalId)
                    .maybeSingle();

            if (registryLookupError) {
                console.error(
                    "[verification] registryLookup:error",
                    formatSupabaseError(registryLookupError),
                );
                throw new Error(registryLookupError.message);
            }

            console.log("[verification] registryLookup:success", {
                found: Boolean(registry),
                registryId: registry?.id,
            });

            if (!registry) {
                throw new Error("National ID not found in registry.");
            }

            if (!registry.photo_url) {
                throw new Error("Registry photo is missing for this ID.");
            }

            const fileResponse = await fetch(imageUri);
            const selfieBlob = await fileResponse.blob();

            const filePath = `${user.id}/verifications/${Date.now()}-selfie.jpg`;

            const { error: uploadError } = await supabase.storage
                .from(VERIFICATION_BUCKET)
                .upload(filePath, selfieBlob, {
                    contentType: "image/jpeg",
                });

            if (uploadError) {
                console.error(
                    "[verification] selfieUpload:error",
                    formatSupabaseError(uploadError),
                );
                throw new Error(uploadError.message);
            }

            console.log("[verification] selfieUpload:success", {
                bucket: VERIFICATION_BUCKET,
                filePath,
            });

            const { data: publicData } = supabase.storage
                .from(VERIFICATION_BUCKET)
                .getPublicUrl(filePath);

            const selfieUrl = publicData.publicUrl;

            console.log("[verification] selfiePublicUrl:created", {
                url: selfieUrl,
            });

            console.log("[verification] faceVerification:start", {
                selfieUrl,
                registryPhotoUrl: registry.photo_url,
                nationalId: maskNationalId(normalizedNationalId),
            });

            const { matched: isMatch, similarityScore } = await verifyFaces({
                selfieUri: imageUri,
                nationalId: normalizedNationalId,
                userId: user.id,
            });

            const verificationStatus = isMatch ? "verified" : "failed";

            console.log("[verification] faceVerification:success", {
                isMatch,
                similarityScore,
            });

            console.log("[verification] persistence:backend-owned", {
                userId: user.id,
                verificationStatus,
            });

            setStatus(verificationStatus);

            loadExistingVerification().catch((loadError) => {
                console.error(
                    "[verification] loadExistingVerification:post-check:error",
                    loadError,
                );
            });

            if (isMatch) {
                Alert.alert(
                    "Verification Successful",
                    "Your identity has been verified from the registry.",
                );
            } else {
                Alert.alert(
                    "Verification Failed",
                    "Face does not match the registry photo.",
                );
            }
        } catch (error: any) {
            console.error("[verification] handleVerification:failed", {
                message: error?.message,
                stack: error?.stack,
            });
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
