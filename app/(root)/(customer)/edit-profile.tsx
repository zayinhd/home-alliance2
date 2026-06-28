import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function CustomerEditProfileScreen() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("full_name, phone, address")
                    .eq("id", user.id)
                    .single();

                if (error) throw error;

                setFullName(data?.full_name || "");
                setPhone(data?.phone || "");
                setAddress(data?.address || "");
            } catch (error: any) {
                Alert.alert(
                    "Error",
                    error.message || "Unable to load profile.",
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user?.id]);

    const handleSave = async () => {
        if (!user?.id) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                })
                .eq("id", user.id);

            if (error) throw error;

            Alert.alert("Success", "Profile updated successfully.");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to update profile.");
        } finally {
            setSaving(false);
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
        <ScrollView className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-8">Edit Profile</Text>

            <Input
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={setFullName}
            />

            <Input
                label="Phone"
                placeholder="Enter phone"
                value={phone}
                onChangeText={setPhone}
            />

            <Input
                label="Address"
                placeholder="Enter address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
            />

            <View className="mt-6 mb-10">
                <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={saving}
                />
            </View>
        </ScrollView>
    );
}
