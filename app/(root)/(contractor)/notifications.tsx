import {
    ActivityIndicator,
    Linking,
    View,
    Text,
    FlatList,
    TouchableOpacity,
} from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import { markNotificationAsRead } from "@/services/notification.service";

export default function ContractorNotificationsScreen() {
    const { notifications, loading, refreshNotifications } = useNotifications();

    const getPhoneFromMessage = (message: string) => {
        const match = message.match(/(\+?\d[\d\s-]{6,})/);

        return match ? match[1].replace(/\s|-/g, "") : null;
    };

    const handleOpenNotification = async (item: any) => {
        await markNotificationAsRead(item.id);

        const phone = getPhoneFromMessage(item.message || "");

        if (phone && item.message?.toLowerCase().includes("call now")) {
            Linking.openURL(`tel:${phone}`);
        }

        refreshNotifications();
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#2a6ff2ff" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-6">Notifications</Text>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleOpenNotification(item)}
                        className={`rounded-2xl p-5 mb-4 ${
                            item.is_read ? "bg-gray-100" : "bg-blue-50"
                        }`}
                    >
                        <Text className="text-lg font-Jost-Bold">
                            {item.title}
                        </Text>

                        <Text className="text-gray-500 mt-1">
                            {item.message}
                        </Text>

                        {!item.is_read && (
                            <Text className="text-primary mt-2 font-Jost-Medium text-xs">
                                New
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center mt-12">
                        <Text className="text-gray-500">
                            No notifications yet.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
