import { supabase } from "@/lib/supabase";

interface CreateNotificationPayload {
    userId: string;
    title: string;
    message: string;
}

export const getNotifications = async (userId: string) => {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
            ascending: false,
        });

    if (error) throw error;

    return data;
};

export const markNotificationAsRead = async (notificationId: string) => {
    const { data, error } = await supabase
        .from("notifications")
        .update({
            is_read: true,
        })
        .eq("id", notificationId);

    if (error) throw error;

    return data;
};

export const createNotification = async ({
    userId,
    title,
    message,
}: CreateNotificationPayload) => {
    const { data, error } = await supabase
        .from("notifications")
        .insert({
            user_id: userId,
            title,
            message,
            is_read: false,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};
