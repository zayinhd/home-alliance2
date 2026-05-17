import {
    View,
    Text,
} from "react-native";

export default function AdminDashboardScreen() {
    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-6">
                Admin Dashboard
            </Text>

            <View className="bg-primary rounded-3xl p-6 mb-4">
                <Text className="text-white text-xl font-Jost-Bold">
                    Total Users
                </Text>

                <Text className="text-white text-4xl mt-2">
                    1,240
                </Text>
            </View>

            <View className="bg-secondary rounded-3xl p-6">
                <Text className="text-white text-xl font-Jost-Bold">
                    Active Contractors
                </Text>

                <Text className="text-white text-4xl mt-2">
                    430
                </Text>
            </View>
        </View>
    );
}