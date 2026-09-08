import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    TextInputProps,
} from "react-native";
import { useState } from "react";

interface Props extends TextInputProps {
    label: string;
    enablePasswordToggle?: boolean;
}

export default function Input({
    label,
    enablePasswordToggle = false,
    ...props
}: Props) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const secureTextEntry = enablePasswordToggle
        ? !isPasswordVisible
        : props.secureTextEntry;

    return (
        <View className="mb-4">
            <Text className="mb-2 font-Jost-Medium text-base">
                {label}
            </Text>

            <View className="relative">
                <TextInput
                    className={`border border-gray-300 rounded-2xl px-4 py-4 ${
                        enablePasswordToggle ? "pr-20" : ""
                    }`}
                    placeholderTextColor="#6b7280"
                    {...props}
                    secureTextEntry={secureTextEntry}
                />

                {enablePasswordToggle ? (
                    <TouchableOpacity
                        onPress={() =>
                            setIsPasswordVisible((prev) => !prev)
                        }
                        style={{
                            position: "absolute",
                            right: 16,
                            top: "50%",
                            transform: [{ translateY: -10 }],
                        }}
                    >
                        <Text className="text-primary font-Jost-Bold">
                            {isPasswordVisible ? "Hide" : "Show"}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}