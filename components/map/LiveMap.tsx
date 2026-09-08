import { useEffect, useState } from "react";

import { View } from "react-native";

import MapView, { Marker } from "react-native-maps";

import { supabase } from "@/lib/supabase";

import { useAuth } from "@/hooks/useAuth";

import { useLocation } from "@/hooks/useLocation";

import { updateUserLocation } from "@/services/location.service";

export default function LiveMap() {
    const { user } = useAuth();

    const { location } = useLocation();

    const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

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

        const channel = supabase.channel(`profile-tracking-${user.id}`);

        channel.on(
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
        );

        channel.subscribe();

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    useEffect(() => {
        if (!location || !user || !trackingEnabled) return;

        updateUserLocation(user.id, location.latitude, location.longitude);
    }, [location, user, trackingEnabled]);

    useEffect(() => {
        const channel = supabase
            .channel("live-locations")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "locations",
                },
                async () => {
                    const { data } = await supabase
                        .from("locations")
                        .select("*");

                    if (data) {
                        setNearbyUsers(data);
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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
