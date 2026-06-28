import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/useAuth";

interface RoleSelectProps {
    navigation: {
        replace: (route: string) => void;
    };
}

export default function RoleSelect({ navigation }: RoleSelectProps) {
    const { user } = useAuth();
    void user;

    return (
        <View className="flex-1 justify-center items-center">
            <Text className="text-xl font-Jost-Bold mb-6">Select Mode</Text>
            <TouchableOpacity
                className="bg-blue-600 rounded-lg px-8 py-3 mb-4"
                onPress={() => {
                    navigation.replace("(root)/contractor");
                }}
            >
                <Text className="text-white font-Jost-Medium">Contractor</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="bg-secondary rounded-lg px-8 py-3"
                onPress={() => {
                    navigation.replace("(root)/customer");
                }}
            >
                <Text className="text-white font-Jost-Medium">Customer</Text>
            </TouchableOpacity>
        </View>
    );
}
