import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import LiveMap from "@/components/map/LiveMap";
import { useAuth } from "@/hooks/useAuth";
import { getServiceProviderBookings } from "@/services/job.service";
import { getLocationsByUserIds } from "@/services/location.service";

export default function ContractorTrackingScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [locations, setLocations] = useState<Record<string, any>>({});

    useEffect(() => {
        const load = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const data = await getServiceProviderBookings(user.id, "all");
                const activeJobs = (data || []).filter((job: any) =>
                    ["accepted", "in_progress"].includes(job.status),
                );
                setJobs(activeJobs);

                const customerIds = activeJobs
                    .map((job: any) => job.customer_id)
                    .filter(Boolean);
                const customerLocations =
                    await getLocationsByUserIds(customerIds);
                const index: Record<string, any> = {};
                customerLocations.forEach((row: any) => {
                    index[row.user_id] = row;
                });
                setLocations(index);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [user?.id]);

    const trackedCount = useMemo(
        () => Object.keys(locations).length,
        [locations],
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white pt-14 px-4">
            <Text className="text-3xl font-Jost-Bold mb-2">
                Customer Tracking
            </Text>
            <Text className="text-gray-500 mb-4">
                Tracking {trackedCount} active customer locations.
            </Text>

            <View className="h-72 rounded-2xl overflow-hidden mb-5">
                <LiveMap />
            </View>

            <FlatList
                data={jobs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const location = locations[item.customer_id];
                    return (
                        <View className="bg-gray-100 rounded-2xl p-4 mb-3">
                            <Text className="font-Jost-Bold text-base">
                                {item.service}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Customer: {item.customer?.username || "—"}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Status: {item.status}
                            </Text>
                            <Text className="text-gray-600 mt-1">
                                Coordinates:{" "}
                                {location
                                    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                                    : "Waiting for location..."}
                            </Text>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View className="items-center mt-12">
                        <Text className="text-gray-500">
                            No active jobs to track.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
