import {
    View,
    Text,
} from "react-native";

import LiveMap from "@/components/map/LiveMap";

import ProtectedRoute from "@/components/feature/ProtectedRoute";

export default function ContractorHomeScreen() {
    return (
        <ProtectedRoute
            allowedRoles={[
                "contractor",
            ]}
        >
            <View className="flex-1 bg-white">
                <View className="px-6 pt-16 pb-4">
                    <Text className="text-3xl font-Jost-Bold">
                        Contractor Home
                    </Text>

                    <Text className="text-gray-500 mt-1">
                        View nearby customers
                    </Text>
                </View>

                <LiveMap />
            </View>
        </ProtectedRoute>
    );
}