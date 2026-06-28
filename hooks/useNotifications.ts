import { useEffect, useState } from "react";

import { useAuth } from "./useAuth";

import { getNotifications } from "@/services/notification.service";
import { supabase } from "@/lib/supabase";

export const useNotifications = () => {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;

        try {
            const data = await getNotifications(user.id);

            setNotifications(data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchNotifications();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return {
        notifications,
        loading,
        refreshNotifications: fetchNotifications,
    };
};
