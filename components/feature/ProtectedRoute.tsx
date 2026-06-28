import { ActivityIndicator, View } from "react-native";

import { Redirect } from "expo-router";

import { useAuth } from "@/hooks/useAuth";

interface Props {
    children: React.ReactNode;

    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
    const { user, loading, role } = useAuth();

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes((role || "").replace(/_/g, " ").trim()) &&
        !allowedRoles.includes(role || "")
    ) {
        return <Redirect href="/" />;
    }

    return children;
}
