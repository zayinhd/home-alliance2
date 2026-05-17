import { supabase } from "@/lib/supabase";

export const getNotifications = async (
    userId: string
) => {
    const { data, error } =
        await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {
                ascending: false,
            });

    if (error) throw error;

    return data;
};

export const markNotificationAsRead =
    async (notificationId: string) => {
        const { data, error } =
            await supabase
                .from("notifications")
                .update({
                    is_read: true,
                })
                .eq("id", notificationId);

        if (error) throw error;

        return data;
    };