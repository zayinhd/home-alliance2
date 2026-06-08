import { Tabs } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

export default function ContractorTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#2a6ff2ff",
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="post"
                options={{
                    title: "Post",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="notifications"
                options={{
                    title: "Notifications",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="notifications"
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
                        <Ionicons name="person" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="my-posts"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
