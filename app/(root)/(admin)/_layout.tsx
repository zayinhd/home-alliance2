import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#2a6ff2ff",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#e5e7eb",
                    marginHorizontal: 12,
                    marginBottom: 10,
                    borderRadius: 16,
                    height: 64,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: "Users",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: "Jobs",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="briefcase" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="verification"
                options={{
                    title: "Verification",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="shield-checkmark"
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="person-circle"
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
