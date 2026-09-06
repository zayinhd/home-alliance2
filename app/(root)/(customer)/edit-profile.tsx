import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    View,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function CustomerEditProfileScreen() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [useLiveLocation, setUseLiveLocation] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select(
                        "username, full_name, phone, address, location_tracking_enabled",
                    )
                    .eq("id", user.id)
                    .single();

                if (error) throw error;

                setUsername(data?.username || user.user_metadata?.username || "");
                setFullName(data?.full_name || "");
                setPhone(data?.phone || "");
                setAddress(data?.address || "");
                setUseLiveLocation(Boolean(data?.location_tracking_enabled));
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

    const updateAddressFromCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location permission needed",
                    "Please allow location access so your address can be filled automatically.",
                );
                setUseLiveLocation(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const geocoded = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });

            const match = geocoded[0];
            const formattedAddress = [
                match?.name,
                match?.street,
                match?.streetNumber,
                match?.city,
                match?.region,
                match?.postalCode,
                match?.country,
            ]
                .filter(Boolean)
                .join(", ");

            if (formattedAddress) {
                setAddress(formattedAddress);
                return;
            }

            Alert.alert(
                "Address unavailable",
                "Your current location could not be translated into an address yet.",
            );
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.message || "Unable to fetch your current location.",
            );
            setUseLiveLocation(false);
        }
    };

    const handleLocationToggle = (value: boolean) => {
        const confirmAction = async () => {
            setUseLiveLocation(value);

            if (value) {
                await updateAddressFromCurrentLocation();
            }
        };

        if (!value) {
            Alert.alert(
                "Disable live location",
                "Do you want to stop sharing your live location?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Turn Off", onPress: () => setUseLiveLocation(false) },
                ],
            );
            return;
        }

        Alert.alert(
            "Use live location",
            "Do you want to share your live location with nearby service providers?",
            [
                {
                    text: "No",
                    style: "cancel",
                    onPress: () => setUseLiveLocation(false),
                },
                { text: "Yes", onPress: confirmAction },
            ],
        );
    };

    const handleSave = async () => {
        if (!user?.id) return;

        try {
            setSaving(true);

            const sanitizedUsername = username.trim();

            if (!sanitizedUsername) {
                Alert.alert("Error", "Username is required.");
                return;
            }

            const { error } = await supabase
                .from("profiles")
                .update({
                    username: sanitizedUsername,
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    location_tracking_enabled: useLiveLocation,
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
                label="Username"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
            />

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

            <View className="mt-6 rounded-2xl bg-gray-100 p-4">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <Text className="font-Jost-Bold text-base">
                            Live Location
                        </Text>
                        <Text className="text-gray-500 mt-1">
                            Share your real-time location when tracking is active.
                        </Text>
                    </View>

                    <Switch
                        value={useLiveLocation}
                        onValueChange={handleLocationToggle}
                        trackColor={{ false: "#d1d5db", true: "#2a6ff2" }}
                        thumbColor={"#ffffff"}
                    />
                </View>
            </View>

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
