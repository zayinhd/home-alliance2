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
    const hasLightBackground =
        (className || "").includes("bg-gray") ||
        (className || "").includes("bg-white") ||
        (className || "").includes("bg-yellow") ||
        (className || "").includes("bg-amber") ||
        (className || "").includes("bg-slate");

    const textClassName = hasLightBackground
        ? "text-gray-900"
        : "text-white";

    const spinnerColor = hasLightBackground ? "#111827" : "#ffffff";

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            className={`bg-primary rounded-2xl py-4 items-center ${className ?? ""}`}
        >
            {loading ? (
                <ActivityIndicator color={spinnerColor} />
            ) : (
                <Text className={`${textClassName} font-Jost-Bold text-base`}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}
