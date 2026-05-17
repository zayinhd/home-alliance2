import {
    Text,
    TextInput,
    View,
    TextInputProps,
} from "react-native";

interface Props extends TextInputProps {
    label: string;
}

export default function Input({
    label,
    ...props
}: Props) {
    return (
        <View className="mb-4">
            <Text className="mb-2 font-Jost-Medium text-base">
                {label}
            </Text>

            <TextInput
                className="border border-gray-300 rounded-2xl px-4 py-4"
                placeholderTextColor="#888"
                {...props}
            />
        </View>
    );
}