import { useEffect, useState } from "react";

import { View } from "react-native";

import MapView, { Marker } from "react-native-maps";

import { supabase } from "@/lib/supabase";

import { useAuth } from "@/hooks/useAuth";

import { useLocation } from "@/hooks/useLocation";

import { updateUserLocation } from "@/services/location.service";

interface LiveMapProps {
    trackedUserIds?: string[];
}

const removeStaleChannels = (topicPrefix: string) => {
    const channels = supabase.getChannels();

    channels.forEach((channel: any) => {
        if (channel?.topic?.startsWith(`realtime:${topicPrefix}`)) {
            supabase.removeChannel(channel);
        }
    });
};

export default function LiveMap({ trackedUserIds }: LiveMapProps) {
    const { user } = useAuth();

    const { location } = useLocation();

    const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    const trackedIdsKey = (trackedUserIds || []).join(",");

    useEffect(() => {
        if (!user?.id) return;

        const topicPrefix = `profile-tracking-${user.id}`;

        // Guard against HMR/strict-mode remounts leaving a subscribed channel with the same topic.
        removeStaleChannels(topicPrefix);

        const loadTrackingSetting = async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("location_tracking_enabled")
                .eq("id", user.id)
                .single();

            if (!error && data) {
                setTrackingEnabled(Boolean(data.location_tracking_enabled));
            }
        };

        loadTrackingSetting();

        const channel = supabase
            .channel(`${topicPrefix}-${Date.now()}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    setTrackingEnabled(
                        Boolean(payload.new?.location_tracking_enabled),
                    );
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    useEffect(() => {
        if (!location || !user || !trackingEnabled) return;

        updateUserLocation(user.id, location.latitude, location.longitude);
    }, [location, user, trackingEnabled]);

    useEffect(() => {
        const topicPrefix = `live-locations-${user?.id || "anon"}`;

        // Ensure no stale live-location subscriptions survive prior mounts.
        removeStaleChannels(topicPrefix);

        const loadLocations = async () => {
            const { data } = await supabase
                .from("locations")
                .select("*");

            const visibleUsers = (data || []).filter((item: any) => {
                if (item.user_id === user?.id) return false;

                if (!trackedUserIds) return true;

                return trackedUserIds.includes(item.user_id);
            });

            setNearbyUsers(visibleUsers);
        };

        loadLocations();

        const channel = supabase
            .channel(`${topicPrefix}-${trackedIdsKey}-${Date.now()}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "locations",
                },
                () => {
                    loadLocations();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, trackedIdsKey]);

    if (!location) {
        return <View className="flex-1 bg-gray-100" />;
    }

    return (
        <View className="flex-1 rounded-3xl overflow-hidden">
            <MapView
                style={{
                    flex: 1,
                    width: "100%",
                }}
                showsUserLocation
                followsUserLocation
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="You"
                />

                {nearbyUsers.map((item) => (
                    <Marker
                        key={item.id}
                        coordinate={{
                            latitude: item.latitude,
                            longitude: item.longitude,
                        }}
                        title={item.user_id}
                    />
                ))}
            </MapView>
        </View>
    );
}
