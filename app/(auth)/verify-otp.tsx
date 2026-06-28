import { useState } from "react";
import { View, Text } from "react-native";
import InputField from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

interface VerifyOTPProps {
    route: {
        params: {
            email: string;
        };
    };
    navigation: {
        replace: (route: string) => void;
    };
}

export default function VerifyOTP({ route, navigation }: VerifyOTPProps) {
    const { email } = route.params;
    const [otp, setOTP] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onVerify = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "signup",
            });
            if (error) throw error;
            navigation.replace("RoleSelect");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6">
            <Text className="text-xl font-Jost-Bold text-center mb-4">
                Verify Code
            </Text>
            <InputField
                label="Enter OTP"
                placeholder="123456"
                value={otp}
                onChangeText={setOTP}
                keyboardType="numeric"
            />
            {error && <Text className="text-red-600 mb-2">{error}</Text>}
            <Button
                title={loading ? "Verifying..." : "Verify"}
                onPress={onVerify}
                disabled={loading}
                className="w-full"
            />
        </View>
    );
}
