import { useEffect, useState } from "react";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";

import { router } from "expo-router";

import Input from "@/components/ui/Input";

import Button from "@/components/ui/Button";

import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/lib/supabase";

const availableProfessions = [
    "Plumber",
    "Electrician",
    "Carpenter",
    "Painter",
    "Cleaner",
    "Welder",
    "Mechanic",
    "Mason",
    "Technician",
];

export default function EditProfileScreen() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState("");

    const [phone, setPhone] = useState("");

    const [experienceYears, setExperienceYears] = useState("");

    const [professions, setProfessions] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user?.id)
                .single();

            if (error) throw error;

            setFullName(data?.full_name || "");

            setPhone(data?.phone || "");

            setExperienceYears(String(data?.experience_years || ""));

            setProfessions(data?.professions || []);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    phone,
                    professions,
                    experience_years: Number(experienceYears) || 0,
                })
                .eq("id", user?.id);

            if (error) throw error;

            Alert.alert("Success", "Profile updated successfully");

            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
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
                label="Phone Number"
                placeholder="Enter phone number"
                value={phone}
                onChangeText={setPhone}
            />

            <Input
                label="Years of Experience"
                placeholder="Enter years of experience"
                keyboardType="numeric"
                value={experienceYears}
                onChangeText={setExperienceYears}
            />

            <View className="mt-6">
                <Text className="text-lg font-Jost-Bold mb-4">
                    Professions (Maximum 3)
                </Text>

                <View className="flex-row flex-wrap">
                    {availableProfessions.map((profession) => {
                        const selected = professions.includes(profession);

                        return (
                            <TouchableOpacity
                                key={profession}
                                onPress={() => {
                                    if (selected) {
                                        setProfessions(
                                            professions.filter(
                                                (p) => p !== profession,
                                            ),
                                        );

                                        return;
                                    }

                                    if (professions.length >= 3) {
                                        Alert.alert(
                                            "Maximum 3 professions allowed",
                                        );
                                        return;
                                    }

                                    setProfessions([
                                        ...professions,
                                        profession,
                                    ]);
                                }}
                                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                                    selected ? "bg-primary" : "bg-gray-200"
                                }`}
                            >
                                <Text
                                    className={`${
                                        selected ? "text-white" : "text-black"
                                    }`}
                                >
                                    {profession}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View className="mt-8 mb-10">
                <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={saving}
                />
            </View>
        </ScrollView>
    );
}
