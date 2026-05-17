import {
    View,
    Text,
    FlatList,
} from "react-native";

const notifications = [
    {
        id: "1",
        title: "Booking Accepted",
        message:
            "Your contractor accepted your request",
    },
    {
        id: "2",
        title: "Location Updated",
        message:
            "Contractor is nearby",
    },
];

export default function NotificationsScreen() {
    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-6">
                Notifications
            </Text>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View className="bg-gray-100 rounded-2xl p-5 mb-4">
                        <Text className="text-lg font-Jost-Bold">
                            {item.title}
                        </Text>

                        <Text className="text-gray-500 mt-1">
                            {item.message}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}