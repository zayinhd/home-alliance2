import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as Location from "expo-location";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
    getContractorById,
    getContractorReviews,
} from "@/services/contractor.service";
import { createBooking } from "@/services/job.service";
import { Ionicons } from "@expo/vector-icons";

const renderStars = (value: number, size = 16) => {
    const safeValue = Number(value) || 0;
    const roundedValue = Math.round(safeValue);

    return (
        <View className="flex-row items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= roundedValue ? "star" : "star-outline"}
                    size={size}
                    color={star <= roundedValue ? "#fbbf24" : "#d1d5db"}
                    style={{ marginRight: 2 }}
                />
            ))}
        </View>
    );
};

type ServiceOption = {
    name: string;
    suggestedBudget: number;
};

const SERVICES_BY_PROFESSION: Record<string, ServiceOption[]> = {
    plumber: [
        { name: "Leak Fix", suggestedBudget: 150 },
        { name: "Pipe Installation", suggestedBudget: 280 },
        { name: "Drain Unclogging", suggestedBudget: 120 },
        { name: "Toilet Repair", suggestedBudget: 180 },
    ],
    electrician: [
        { name: "Wiring Repair", suggestedBudget: 220 },
        { name: "Socket Installation", suggestedBudget: 140 },
        { name: "Lighting Installation", suggestedBudget: 170 },
        { name: "Fault Diagnosis", suggestedBudget: 130 },
    ],
    carpenter: [
        { name: "Door Repair", suggestedBudget: 190 },
        { name: "Cabinet Installation", suggestedBudget: 360 },
        { name: "Shelving", suggestedBudget: 220 },
        { name: "Furniture Fix", suggestedBudget: 180 },
    ],
    painter: [
        { name: "Interior Wall Painting", suggestedBudget: 260 },
        { name: "Exterior Painting", suggestedBudget: 420 },
        { name: "Touch-up Painting", suggestedBudget: 140 },
        { name: "Ceiling Painting", suggestedBudget: 210 },
    ],
    cleaner: [
        { name: "Home Deep Cleaning", suggestedBudget: 200 },
        { name: "Office Cleaning", suggestedBudget: 320 },
        { name: "Post-Construction Cleaning", suggestedBudget: 450 },
        { name: "Move-in Cleaning", suggestedBudget: 240 },
    ],
    welder: [
        { name: "Gate Repair", suggestedBudget: 300 },
        { name: "Metal Fabrication", suggestedBudget: 500 },
        { name: "Window Grill Installation", suggestedBudget: 350 },
        { name: "Welding Touch-up", suggestedBudget: 220 },
    ],
    mechanic: [
        { name: "Engine Diagnostics", suggestedBudget: 260 },
        { name: "Brake Service", suggestedBudget: 280 },
        { name: "Oil Change", suggestedBudget: 120 },
        { name: "Battery Replacement", suggestedBudget: 170 },
    ],
    mason: [
        { name: "Block Work", suggestedBudget: 400 },
        { name: "Plastering", suggestedBudget: 260 },
        { name: "Tile Installation", suggestedBudget: 350 },
        { name: "Concrete Repair", suggestedBudget: 300 },
    ],
    technician: [
        { name: "Appliance Diagnosis", suggestedBudget: 180 },
        { name: "AC Servicing", suggestedBudget: 260 },
        { name: "TV Repair", suggestedBudget: 220 },
        { name: "General Device Fix", suggestedBudget: 200 },
    ],
    general: [
        { name: "General Maintenance", suggestedBudget: 180 },
        { name: "Home Inspection", suggestedBudget: 150 },
        { name: "Minor Repairs", suggestedBudget: 140 },
        { name: "Installation Support", suggestedBudget: 190 },
    ],
};

const normalizeProfession = (value: string) => value.trim().toLowerCase();

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
    const [useLiveTracking, setUseLiveTracking] = useState(false);
    const [resolvingLocation, setResolvingLocation] = useState(false);
    const [showServiceOptions, setShowServiceOptions] = useState(false);

    const providerProfession = useMemo(() => {
        if (Array.isArray(profile?.professions) && profile.professions.length) {
            return String(profile.professions[0]);
        }

        return String(profile?.profession || profile?.professions || "general");
    }, [profile]);

    const serviceOptions = useMemo(() => {
        const normalized = normalizeProfession(providerProfession);

        if (SERVICES_BY_PROFESSION[normalized]) {
            return SERVICES_BY_PROFESSION[normalized];
        }

        const matchedKey = Object.keys(SERVICES_BY_PROFESSION).find(
            (key) =>
                key !== "general" &&
                (normalized.includes(key) || key.includes(normalized)),
        );

        return matchedKey
            ? SERVICES_BY_PROFESSION[matchedKey]
            : SERVICES_BY_PROFESSION.general;
    }, [providerProfession]);

    const selectedServiceOption = useMemo(
        () => serviceOptions.find((item) => item.name === service) || null,
        [serviceOptions, service],
    );

    const load = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [provider, providerReviews] = await Promise.all([
                getContractorById(id),
                getContractorReviews(id),
            ]);

            setProfile(provider);
            setReviews(providerReviews || []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to load provider.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const getLiveAddress = async () => {
        try {
            setResolvingLocation(true);

            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location permission needed",
                    "Please allow location access to auto-fill your booking location.",
                );

                return null;
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
                setLocation(formattedAddress);
                return formattedAddress;
            }

            const fallbackCoordinates = `${currentLocation.coords.latitude.toFixed(
                6,
            )}, ${currentLocation.coords.longitude.toFixed(6)}`;
            setLocation(fallbackCoordinates);
            return fallbackCoordinates;
        } catch (error: any) {
            Alert.alert(
                "Location error",
                error?.message || "Unable to fetch current location.",
            );
            return null;
        } finally {
            setResolvingLocation(false);
        }
    };

    const handleLiveTrackingToggle = async (value: boolean) => {
        if (!value) {
            setUseLiveTracking(false);
            return;
        }

        const liveAddress = await getLiveAddress();

        if (!liveAddress) {
            setUseLiveTracking(false);
            return;
        }

        setUseLiveTracking(true);
    };

    const handleBook = async () => {
        if (!user?.id || !id) return;

        if (!service.trim() || !budget.trim()) {
            Alert.alert("Missing details", "Service and budget are required.");
            return;
        }

        try {
            setBooking(true);

            let bookingLocation = location.trim();

            if (useLiveTracking) {
                const liveAddress = await getLiveAddress();

                if (!liveAddress) {
                    Alert.alert(
                        "Location required",
                        "Live location is enabled, but current location could not be fetched.",
                    );
                    return;
                }

                bookingLocation = liveAddress.trim();
            }

            if (!bookingLocation) {
                Alert.alert(
                    "Missing details",
                    "Location is required before sending booking.",
                );
                return;
            }

            await createBooking({
                customerId: user.id,
                serviceProviderId: id,
                service: service.trim(),
                budget: Number(budget) || 0,
                location: bookingLocation,
                description: description.trim(),
            });

            Alert.alert("Success", "Booking request sent to provider.");
            setService("");
            setBudget("");
            setLocation("");
            setDescription("");
            setShowServiceOptions(false);
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
                <View className="flex-row items-center mt-3">
                    {renderStars(Number(profile?.rating) || 0, 18)}
                    <Text className="text-white ml-2 font-Jost-Bold">
                        {Number(profile?.rating || 0).toFixed(1)}
                    </Text>
                    <Text className="text-white/80 ml-2">
                        ({profile?.reviews_count || 0} reviews)
                    </Text>
                </View>
            </View>

            <Text className="text-xl font-Jost-Bold mb-3">
                Book This Provider
            </Text>

            <View className="mb-4">
                <Text className="mb-2 font-Jost-Medium text-base">Service</Text>

                <TouchableOpacity
                    onPress={() => setShowServiceOptions((prev) => !prev)}
                    className="border border-gray-300 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                >
                    <Text className={service ? "text-black" : "text-gray-500"}>
                        {service || "Select a service"}
                    </Text>

                    <Ionicons
                        name={showServiceOptions ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#6b7280"
                    />
                </TouchableOpacity>

                {showServiceOptions ? (
                    <View className="mt-2 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                        {serviceOptions.map((item) => (
                            <TouchableOpacity
                                key={item.name}
                                onPress={() => {
                                    setService(item.name);
                                    setBudget(String(item.suggestedBudget));
                                    setShowServiceOptions(false);
                                }}
                                className="px-4 py-3 border-b border-gray-100"
                            >
                                <Text className="font-Jost-Medium text-gray-800">
                                    {item.name}
                                </Text>
                                <Text className="text-xs text-gray-500 mt-1">
                                    Suggested budget: Ghc {item.suggestedBudget}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : null}
            </View>

            <Input
                label="Budget (Ghc)"
                placeholder="e.g. 120"
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
            />

            {selectedServiceOption ? (
                <Text className="text-xs text-gray-500 mb-4 -mt-2">
                    Suggested budget for {selectedServiceOption.name}: Ghc{" "}
                    {selectedServiceOption.suggestedBudget}
                </Text>
            ) : null}

            <View className="mb-4 rounded-2xl bg-gray-100 p-4">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <Text className="font-Jost-Bold text-base">
                            Live Tracking
                        </Text>
                        <Text className="text-gray-500 mt-1">
                            Auto-fill your current location for this booking.
                        </Text>
                    </View>

                    <Switch
                        value={useLiveTracking}
                        onValueChange={handleLiveTrackingToggle}
                        disabled={resolvingLocation || booking}
                        trackColor={{ false: "#d1d5db", true: "#2a6ff2" }}
                        thumbColor="#ffffff"
                    />
                </View>
            </View>

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

                        <View className="flex-row items-center mt-2">
                            {renderStars(Number(item.rating) || 0, 16)}
                            <Text className="ml-2 text-gray-700 font-Jost-Medium">
                                {Number(item.rating || 0).toFixed(1)}/5
                            </Text>
                        </View>

                        <Text className="text-gray-500 mt-2">
                            {item.comment || "No comment"}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text className="text-gray-500 mb-10">No reviews yet.</Text>
                }
            />

            <View className="mb-12" />
        </ScrollView>
    );
}
