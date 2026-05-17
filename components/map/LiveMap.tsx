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

    useEffect(() => {
        if (!location || !user) return;

        updateUserLocation(user.id, location.latitude, location.longitude);
    }, [location]);

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
        <View className="flex-1">
            <MapView
                style={{
                    height: "50%",
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
