import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
} from "react-native";

interface Props {
    title: string;
    onPress: () => void;
    loading?: boolean;
}

export default function Button({
    title,
    onPress,
    loading,
}: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-primary rounded-2xl py-4 items-center"
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text className="text-white font-Jost-Bold text-base">
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}