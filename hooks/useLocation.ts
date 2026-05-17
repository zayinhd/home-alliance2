import { useEffect, useState } from "react";

import * as Location from "expo-location";

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export const useLocation = () => {
    const [location, setLocation] =
        useState<Coordinates | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [errorMsg, setErrorMsg] =
        useState<string | null>(null);

    useEffect(() => {
        let subscription:
            | Location.LocationSubscription
            | undefined;

        const getLocation = async () => {
            try {
                const {
                    status,
                } =
                    await Location.requestForegroundPermissionsAsync();

                if (status !== "granted") {
                    setErrorMsg(
                        "Permission denied"
                    );

                    setLoading(false);

                    return;
                }

                const currentLocation =
                    await Location.getCurrentPositionAsync(
                        {}
                    );

                setLocation({
                    latitude:
                        currentLocation.coords
                            .latitude,
                    longitude:
                        currentLocation.coords
                            .longitude,
                });

                subscription =
                    await Location.watchPositionAsync(
                        {
                            accuracy:
                                Location.Accuracy.High,
                            timeInterval: 5000,
                            distanceInterval: 5,
                        },
                        (updatedLocation) => {
                            setLocation({
                                latitude:
                                    updatedLocation
                                        .coords
                                        .latitude,
                                longitude:
                                    updatedLocation
                                        .coords
                                        .longitude,
                            });
                        }
                    );
            } catch (error: any) {
                setErrorMsg(error.message);
            } finally {
                setLoading(false);
            }
        };

        getLocation();

        return () => {
            subscription?.remove();
        };
    }, []);

    return {
        location,
        loading,
        errorMsg,
    };
};