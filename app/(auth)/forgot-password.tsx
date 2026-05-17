import { useState } from "react";

import {
    View,
    Text,
    Alert,
} from "react-native";

import Input from "@/components/ui/Input";

import Button from "@/components/ui/Button";

import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
    const [email, setEmail] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleResetPassword =
        async () => {
            try {
                setLoading(true);

                const { error } =
                    await supabase.auth.resetPasswordForEmail(
                        email
                    );

                if (error) {
                    throw error;
                }

                Alert.alert(
                    "Success",
                    "Password reset email sent"
                );
            } catch (error: any) {
                Alert.alert(
                    "Error",
                    error.message
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <View className="flex-1 bg-white justify-center px-6">
            <Text className="text-4xl font-Jost-Bold mb-2">
                Forgot Password
            </Text>

            <Text className="text-gray-500 mb-10">
                Enter your email to reset password
            </Text>

            <Input
                label="Email"
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <Button
                title="Send Reset Link"
                onPress={
                    handleResetPassword
                }
                loading={loading}
            />
        </View>
    );
}