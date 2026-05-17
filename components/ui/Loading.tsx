import {
    View,
    ActivityIndicator,
    Text,
} from "react-native";

interface Props {
    text?: string;
}

export default function Loading({
    text = "Loading...",
}: Props) {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator
                size="large"
            />

            <Text className="mt-4 text-gray-500">
                {text}
            </Text>
        </View>
    );
}