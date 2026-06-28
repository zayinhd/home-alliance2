import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface Props {
    title: string;
    onPress: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Button({
    title,
    onPress,
    loading,
    disabled,
    className,
}: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            className={`bg-primary rounded-2xl py-4 items-center ${className ?? ""}`}
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
