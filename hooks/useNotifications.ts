import {
    useEffect,
    useState,
} from "react";

import { useAuth } from "./useAuth";

import {
    getNotifications,
} from "@/services/notification.service";

export const useNotifications = () => {
    const { user } = useAuth();

    const [notifications, setNotifications] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchNotifications =
            async () => {
                try {
                    const data =
                        await getNotifications(
                            user.id
                        );

                    setNotifications(
                        data || []
                    );
                } catch (error) {
                    console.log(error);
                } finally {
                    setLoading(false);
                }
            };

        fetchNotifications();
    }, [user]);

    return {
        notifications,
        loading,
    };
};