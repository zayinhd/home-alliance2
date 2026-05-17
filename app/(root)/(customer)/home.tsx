import {
    View,
    Text,
} from "react-native";

import LiveMap from "@/components/map/LiveMap";

import ProtectedRoute from "@/components/feature/ProtectedRoute";

export default function CustomerHomeScreen() {
    return (
        <ProtectedRoute
            allowedRoles={[
                "customer",
            ]}
        >
            <View className="flex-1 bg-white">
                <View className="px-6 pt-16 pb-4">
                    <Text className="text-3xl font-Jost-Bold">
                        Customer Home
                    </Text>

                    <Text className="text-gray-500 mt-1">
                        Find nearby contractors
                    </Text>
                </View>

                <LiveMap />
            </View>
        </ProtectedRoute>
    );
}