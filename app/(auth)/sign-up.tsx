import { useState } from "react";

import { View, Text, Alert, TouchableOpacity } from "react-native";

import { Link, router } from "expo-router";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { signUp } from "@/services/auth.service";

export default function SignUpScreen() {
    const [username, setUsername] = useState("");

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");

    const [role, setRole] = useState<"customer" | "service provider">(
        "customer",
    );

    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        try {
            const trimmedUsername = username.trim();

            if (!trimmedUsername) {
                return Alert.alert("Error", "Username is required");
            }

            if (password !== confirmPassword) {
                return Alert.alert("Error", "Passwords do not match");
            }

            setLoading(true);

            await signUp({
                username: trimmedUsername,
                email,
                password,
                role,
            });

            Alert.alert("Success", "Account created successfully");

            if (role === "customer") {
                router.replace("/(root)/(customer)/home");
            }

            if (role === "service provider") {
                router.replace("/(root)/(contractor)/home");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <Text className="text-4xl font-Jost-Bold mb-2">Create Account</Text>

            <Text className="text-gray-500 mb-10">Join Home Alliance</Text>

            <Input
                label="Username"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
            />

            <Input
                label="Email"
                placeholder="Enter email"
                autoCapitalize="none"
                keyboardType="email-address"
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

            <Input
                label="Confirm Password"
                placeholder="Confirm password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            {/* ROLE SELECTOR */}

            <View className="mb-6">
                <Text className="mb-3 font-Jost-Medium text-base">
                    Select Role
                </Text>

                <View className="flex-row gap-4">
                    <TouchableOpacity
                        onPress={() => setRole("customer")}
                        className={`flex-1 py-4 rounded-2xl items-center ${
                            role === "customer" ? "bg-primary" : "bg-gray-200"
                        }`}
                    >
                        <Text
                            className={`font-Jost-Bold ${
                                role === "customer"
                                    ? "text-white"
                                    : "text-black"
                            }`}
                        >
                            Customer
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setRole("service provider")}
                        className={`flex-1 py-4 rounded-2xl items-center ${
                            role === "service provider"
                                ? "bg-primary"
                                : "bg-gray-200"
                        }`}
                    >
                        <Text
                            className={`font-Jost-Bold ${
                                role === "service provider"
                                    ? "text-white"
                                    : "text-black"
                            }`}
                        >
                            Contractor
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={loading}
            />

            <View className="flex-row justify-center mt-6">
                <Text>Already have an account?</Text>

                <Link href="/(auth)/sign-in" asChild>
                    <TouchableOpacity>
                        <Text className="text-primary ml-2 font-Jost-Bold">
                            Sign In
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
