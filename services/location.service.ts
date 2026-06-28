import { supabase } from "@/lib/supabase";

export const updateUserLocation = async (
    userId: string,
    latitude: number,
    longitude: number,
) => {
    const { data, error } = await supabase.from("locations").upsert(
        {
            user_id: userId,
            latitude,
            longitude,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "user_id",
        },
    );

    if (error) throw error;

    return data;
};

export const getNearbyUsers = async () => {
    const { data, error } = await supabase.from("locations").select("*");

    if (error) throw error;

    return data;
};

export const getLocationsByUserIds = async (userIds: string[]) => {
    if (!userIds.length) return [];

    const { data, error } = await supabase
        .from("locations")
        .select("*")
        .in("user_id", userIds);

    if (error) throw error;

    return data || [];
};
