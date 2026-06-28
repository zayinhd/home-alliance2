import { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";

import { Link, router } from "expo-router";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { signIn } from "@/services/auth.service";

export default function SignInScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            setLoading(true);

            const { user } = await signIn(email, password);

            const role = user?.user_metadata?.role;

            if (role === "customer") {
                router.replace("/(root)/(customer)/home");
            }

            if (
                role === "contractor" ||
                role === "service_provider" ||
                role === "service provider"
            ) {
                router.replace("/(root)/(contractor)/home");
            }

            if (role === "admin") {
                router.replace("/(root)/(admin)/dashboard");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <Text className="text-4xl font-Jost-Bold mb-2">
                Welcome To Home Alliance
            </Text>

            <Text className="text-gray-500 mb-10">Sign in to continue</Text>

            <Input
                label="Email"
                placeholder="Enter email"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <Input
                label="Password"
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity
                className="items-end mb-6"
                onPress={() => router.push("/(auth)/forgot-password")}
            >
                <Text className="text-primary font-Jost-Bold">
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleSignIn} loading={loading} />

            <View className="flex-row justify-center mt-6">
                <Text>Don’t have an account?</Text>

                <Link href="/(auth)/sign-up" asChild>
                    <TouchableOpacity>
                        <Text className="text-primary ml-2 font-Jost-Bold">
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
