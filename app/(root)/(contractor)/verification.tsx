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

const VERIFICATION_BUCKET = "verification";

export default function VerificationScreen() {
    const { user } = useAuth();

    const [nationalId, setNationalId] = useState("");

    const [imageUri, setImageUri] = useState("");

    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState<string>("not_submitted");

    const loadExistingVerification = async () => {
        if (!user?.id) return;

        const { data } = await supabase
            .from("user_verifications")
            .select("verification_status")
            .eq("user_id", user.id)
            .maybeSingle();

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
            if (!nationalId.trim()) {
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

            const fileResponse = await fetch(imageUri);
            const selfieBlob = await fileResponse.blob();

            const filePath = `${user.id}/${Date.now()}-selfie.jpg`;

            const { error: uploadError } = await supabase.storage
                .from(VERIFICATION_BUCKET)
                .upload(filePath, selfieBlob, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            const { data: publicData } = supabase.storage
                .from(VERIFICATION_BUCKET)
                .getPublicUrl(filePath);

            const selfieUrl = publicData.publicUrl;

            const { error: registryError } = await supabase
                .from("national_registry")
                .upsert(
                    {
                        id: user.id,
                        full_name: user.user_metadata?.username || "",
                        national_id_number: nationalId.trim(),
                        photo_url: selfieUrl,
                    },
                    {
                        onConflict: "id",
                    },
                );

            if (registryError) {
                throw new Error(registryError.message);
            }

            const { error: verificationError } = await supabase
                .from("user_verifications")
                .upsert(
                    {
                        user_id: user.id,
                        registry_id: user.id,
                        verification_status: "pending",
                        similarity_score: null,
                        verified_at: null,
                    },
                    {
                        onConflict: "user_id",
                    },
                );

            if (verificationError) {
                throw new Error(verificationError.message);
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    is_verified: false,
                    verification_status: "pending",
                })
                .eq("id", user.id);

            if (profileError) {
                throw new Error(profileError.message);
            }

            setStatus("pending");

            Alert.alert(
                "Verification Submitted",
                "Your verification request has been submitted for admin review.",
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
                    className="border-2 border-dashed border-primary rounded-3xl h-64 w-full self-center items-center justify-center overflow-hidden"
                >
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            className="w-full h-full rounded-3xl"
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
