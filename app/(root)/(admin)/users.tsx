import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Button from "@/components/ui/Button";
import { exportReportAsPdf } from "@/lib/report-export";
import {
    createAdminUser,
    deleteUser,
    getAdminUsers,
    suspendUser,
} from "@/services/admin.service";

const roleFilters = ["all", "customer", "service provider", "admin"];
const roleOptions = ["customer", "service provider", "admin"];

const getRoleLabel = (value: string) =>
    value === "all"
        ? "All"
        : value === "service provider"
          ? "Service Provider"
          : value.charAt(0).toUpperCase() + value.slice(1);

const initialForm = {
    username: "",
    email: "",
    password: "",
    role: "customer",
    profession: "",
    phone: "",
    isVerified: false,
};

export default function AdminUsersScreen() {
    const params = useLocalSearchParams<{
        role?: string;
        openCreate?: string;
    }>();
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [role, search]);

    useEffect(() => {
        if (params.role && roleFilters.includes(params.role)) {
            setRole(params.role);
        }

        if (params.openCreate === "1") {
            setShowCreateModal(true);
        }
    }, [params.role, params.openCreate]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAdminUsers(role, search);
            setUsers(data || []);
        } catch (error) {
            console.warn("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (
            !form.username.trim() ||
            !form.email.trim() ||
            !form.password.trim()
        ) {
            Alert.alert(
                "Missing details",
                "Please fill in username, email, and password.",
            );
            return;
        }

        try {
            setCreating(true);
            await createAdminUser({
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password,
                role: form.role,
                professions: form.profession.trim()
                    ? [form.profession.trim()]
                    : undefined,
                phone: form.phone.trim() || undefined,
                isVerified: form.isVerified,
            });

            Alert.alert("Success", "User created successfully.");
            setShowCreateModal(false);
            setForm(initialForm);
            loadUsers();
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Unable to create user.");
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (value?: string) => {
        if (!value) return "—";
        return new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleToggleSuspend = (item: any) => {
        const nextStatus = !item.is_suspended;
        const verb = nextStatus ? "Suspend" : "Unsuspend";

        Alert.alert(
            `${verb} User`,
            `Are you sure you want to ${verb.toLowerCase()} ${item.username || "this user"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: verb,
                    style: nextStatus ? "destructive" : "default",
                    onPress: async () => {
                        try {
                            setProcessingUserId(item.id);
                            await suspendUser(item.id, nextStatus);
                            await loadUsers();
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error?.message ||
                                    `Unable to ${verb.toLowerCase()} user.`,
                            );
                        } finally {
                            setProcessingUserId(null);
                        }
                    },
                },
            ],
        );
    };

    const handleDeleteUser = (item: any) => {
        Alert.alert(
            "Delete User",
            `This will permanently remove ${item.username || "this user"}. Continue?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setProcessingUserId(item.id);
                            await deleteUser(item.id);
                            await loadUsers();
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error?.message || "Unable to delete user.",
                            );
                        } finally {
                            setProcessingUserId(null);
                        }
                    },
                },
            ],
        );
    };

    const handleExportReport = async () => {
        try {
            setExporting(true);
            await exportReportAsPdf({
                title: "Manage Users",
                subtitle:
                    role === "all"
                        ? search.trim()
                            ? `Search: ${search.trim()}`
                            : "All users"
                        : `Role: ${getRoleLabel(role)}${search.trim() ? ` • Search: ${search.trim()}` : ""}`,
                headers: [
                    "Name",
                    "Email",
                    "Role",
                    "Registered",
                    "Verified",
                    "Profession",
                    "Phone",
                    "Status",
                ],
                rows: users.map((item) => [
                    item.username || "—",
                    item.email || "—",
                    item.role || "—",
                    formatDate(item.created_at),
                    item.is_verified ? "Yes" : "No",
                    Array.isArray(item.professions)
                        ? item.professions.join(", ")
                        : item.professions ?? "—",
                    item.phone || "—",
                    item.is_suspended ? "Suspended" : "Active",
                ]),
                fileName: `users-${role.replace(/\s+/g, "-")}-${Date.now()}`,
                successMessage: `${getRoleLabel(role)} users report saved as a PDF.`,
            });
        } catch (error: any) {
            Alert.alert(
                "Export failed",
                error?.message || "Unable to export users report.",
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                className="flex-1 px-4 pt-14"
                contentContainerStyle={{ paddingBottom: 28 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-3xl font-Jost-Bold">Manage Users</Text>
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        className="bg-primary px-4 py-2 rounded-full"
                    >
                        <Text className="text-white font-Jost-Bold">+ Add</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    placeholder="Search users"
                    placeholderTextColor="#4b5563"
                    value={search}
                    onChangeText={setSearch}
                    className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                />

                <FlatList
                    horizontal
                    data={roleFilters}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                    contentContainerStyle={{
                        paddingRight: 8,
                        alignItems: "center",
                        gap: 8,
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setRole(item)}
                            className={`h-10 px-4 py-2 rounded-full items-center justify-center ${
                                role === item ? "bg-primary" : "bg-gray-100"
                            }`}
                        >
                            <Text
                                className={`${
                                    role === item ? "text-white" : "text-gray-700"
                                } font-Jost-Medium`}
                            >
                                {getRoleLabel(item)}
                            </Text>
                        </TouchableOpacity>
                    )}
                />

                {loading ? (
                    <View className="flex items-center justify-center py-10">
                        <ActivityIndicator size="large" color="#2a6ff2ff" />
                    </View>
                ) : (
                    <>
                        <View className="flex rounded-2xl border border-gray-200 overflow-hidden">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                            >
                                <View>
                                    <View className="flex-row bg-gray-100 px-3 py-3">
                                        <Text className="w-44 font-Jost-Bold">Name</Text>
                                        <Text className="w-64 font-Jost-Bold">Email</Text>
                                        <Text className="w-36 font-Jost-Bold">Role</Text>
                                        <Text className="w-36 font-Jost-Bold">Registered</Text>
                                        <Text className="w-28 font-Jost-Bold">Verified</Text>
                                        <Text className="w-40 font-Jost-Bold">Profession</Text>
                                        <Text className="w-36 font-Jost-Bold">Phone</Text>
                                        <Text className="w-28 font-Jost-Bold">Status</Text>
                                        <Text className="w-48 font-Jost-Bold">Actions</Text>
                                    </View>

                                    <FlatList
                                        data={users}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                        renderItem={({ item }) => (
                                            <View className="flex flex-row px-3 py-3 border-b border-gray-100">
                                                <Text className="w-44" numberOfLines={2}>
                                                    {item.username || "—"}
                                                </Text>
                                                <Text className="w-64" numberOfLines={2}>
                                                    {item.email || "—"}
                                                </Text>
                                                <Text className="w-36" numberOfLines={2}>
                                                    {item.role || "—"}
                                                </Text>
                                                <Text className="w-36" numberOfLines={2}>
                                                    {formatDate(item.created_at)}
                                                </Text>
                                                <Text className="w-28" numberOfLines={2}>
                                                    {item.is_verified ? "Yes" : "No"}
                                                </Text>
                                                <Text className="w-40" numberOfLines={2}>
                                                    {Array.isArray(item.professions)
                                                        ? item.professions.join(", ")
                                                        : item.professions ?? "—"}
                                                </Text>
                                                <Text className="w-36" numberOfLines={2}>
                                                    {item.phone || "—"}
                                                </Text>
                                                <Text className="w-28" numberOfLines={2}>
                                                    {item.is_suspended ? "Suspended" : "Active"}
                                                </Text>

                                                <View className="w-48 flex-row items-center gap-2">
                                                    <TouchableOpacity
                                                        disabled={processingUserId === item.id}
                                                        onPress={() => handleToggleSuspend(item)}
                                                        className={`px-3 py-1 rounded-full ${
                                                            item.is_suspended
                                                                ? "bg-emerald-100"
                                                                : "bg-amber-100"
                                                        }`}
                                                    >
                                                        <Text
                                                            className={`font-Jost-Medium ${
                                                                item.is_suspended
                                                                    ? "text-emerald-700"
                                                                    : "text-amber-700"
                                                            }`}
                                                        >
                                                            {item.is_suspended ? "Unsuspend" : "Suspend"}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        disabled={processingUserId === item.id}
                                                        onPress={() => handleDeleteUser(item)}
                                                        className="px-3 py-1 rounded-full bg-red-100"
                                                    >
                                                        <Text className="text-red-700 font-Jost-Medium">
                                                            Delete
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                        ListEmptyComponent={
                                            <View className="px-3 py-6">
                                                <Text className="text-gray-500">
                                                    No users found.
                                                </Text>
                                            </View>
                                        }
                                    />
                                </View>
                            </ScrollView>
                        </View>

                        <Button
                            title={
                                exporting
                                    ? "Generating PDF report..."
                                    : "Download Report as PDF"
                            }
                            onPress={handleExportReport}
                            loading={exporting}
                            disabled={exporting || users.length === 0}
                            className="mt-3"
                        />
                    </>
                )}
            </ScrollView>

            <Modal
                visible={showCreateModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl p-5">
                        <Text className="text-xl font-Jost-Bold mb-4">
                            Add New User
                        </Text>

                        <TextInput
                            placeholder="Full name"
                            value={form.username}
                            onChangeText={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    username: value,
                                }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />
                        <TextInput
                            placeholder="Email"
                            value={form.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={(value) =>
                                setForm((prev) => ({ ...prev, email: value }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />
                        <TextInput
                            placeholder="Temporary password"
                            value={form.password}
                            secureTextEntry
                            onChangeText={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    password: value,
                                }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />
                        <TextInput
                            placeholder="Profession (optional)"
                            value={form.profession}
                            onChangeText={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    profession: value,
                                }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />
                        <TextInput
                            placeholder="Phone (optional)"
                            value={form.phone}
                            onChangeText={(value) =>
                                setForm((prev) => ({ ...prev, phone: value }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />

                        <View className="flex-row flex-wrap mb-3">
                            {roleOptions.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() =>
                                        setForm((prev) => ({
                                            ...prev,
                                            role: item,
                                        }))
                                    }
                                    className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                                        form.role === item
                                            ? "bg-primary"
                                            : "bg-gray-100"
                                    }`}
                                >
                                    <Text
                                        className={`${
                                            form.role === item
                                                ? "text-white"
                                                : "text-gray-700"
                                        } font-Jost-Medium`}
                                    >
                                        {item === "service provider"
                                            ? "Service Provider"
                                            : item.charAt(0).toUpperCase() + item.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row items-center justify-between mb-5">
                            <Text className="text-gray-700 font-Jost-Medium">
                                Mark as verified
                            </Text>
                            <Switch
                                value={form.isVerified}
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        isVerified: value,
                                    }))
                                }
                            />
                        </View>

                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                                className="flex-1 border border-gray-300 rounded-2xl py-3 mr-2 items-center"
                            >
                                <Text className="text-gray-700 font-Jost-Bold">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateUser}
                                disabled={creating}
                                className="flex-1 bg-primary rounded-2xl py-3 items-center"
                            >
                                <Text className="text-white font-Jost-Bold">
                                    {creating ? "Creating..." : "Create"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
