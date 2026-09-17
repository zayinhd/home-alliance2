import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Button from "@/components/ui/Button";
import PullableModal from "@/components/ui/PullableModal";
import { exportReportAsPdf } from "@/lib/report-export";
import {
    deleteAdminJob,
    getAdminJobs,
    updateAdminJob,
} from "@/services/admin.service";

const statusFilters = ["all", "pending", "accepted", "completed", "cancelled"];

const editableStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];

const initialEditJobForm = {
    service: "",
    budget: "",
    status: "pending",
    location: "",
    description: "",
};

export default function AdminJobsScreen() {
    const params = useLocalSearchParams<{ status?: string }>();
    const [jobs, setJobs] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingJobId, setEditingJobId] = useState<string | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editJobForm, setEditJobForm] = useState(initialEditJobForm);
    const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

    useEffect(() => {
        loadJobs();
    }, [status, search]);

    useEffect(() => {
        if (params.status && statusFilters.includes(params.status)) {
            setStatus(params.status);
        }
    }, [params.status]);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const data = await getAdminJobs(status);
            const filtered = (data || []).filter((job: any) => {
                const query = search.toLowerCase();
                return !query || `${job.service || ""} ${job.customer?.username || ""} ${job.contractor?.username || ""}`.toLowerCase().includes(query);
            });
            setJobs(filtered);
        } catch (error) {
            console.warn("Failed to load jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async () => {
        try {
            setExporting(true);
            await exportReportAsPdf({
                title: "Jobs Overview",
                subtitle: status === "all" ? (search.trim() ? `Search: ${search.trim()}` : "All jobs") : `Status: ${status}${search.trim() ? ` • Search: ${search.trim()}` : ""}`,
                headers: ["Service", "Customer", "Provider", "Budget", "Status"],
                rows: jobs.map((item) => [
                    item.service || "—",
                    item.customer?.username || "—",
                    item.contractor?.username || "—",
                    `Ghc ${item.budget || 0}`,
                    item.status || "—",
                ]),
                fileName: `jobs-${status}-${Date.now()}`,
                successMessage: "Jobs report saved as a PDF.",
            });
        } catch (error: any) {
            Alert.alert("Export failed", error?.message || "Unable to export jobs report.");
        } finally {
            setExporting(false);
        }
    };

    const openEditJobModal = (job: any) => {
        setEditingJobId(job.id);
        setEditJobForm({
            service: job.service || "",
            budget: String(job.budget || ""),
            status: job.status || "pending",
            location: job.location || "",
            description: job.description || "",
        });
        setShowEditModal(true);
    };

    const handleUpdateJob = async () => {
        if (!editingJobId) return;

        if (!editJobForm.service.trim()) {
            Alert.alert("Missing details", "Service name is required.");
            return;
        }

        try {
            setSavingEdit(true);
            await updateAdminJob({
                jobId: editingJobId,
                service: editJobForm.service.trim(),
                budget: Number(editJobForm.budget) || 0,
                status: editJobForm.status,
                location: editJobForm.location.trim(),
                description: editJobForm.description.trim(),
            });

            Alert.alert("Success", "Job updated successfully.");
            setShowEditModal(false);
            setEditingJobId(null);
            setEditJobForm(initialEditJobForm);
            await loadJobs();
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Unable to update job.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteJob = (job: any) => {
        Alert.alert(
            "Delete Job",
            `Delete ${job?.service || "this job"}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeletingJobId(job.id);
                            await deleteAdminJob(job.id);
                            await loadJobs();
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error?.message || "Unable to delete job.",
                            );
                        } finally {
                            setDeletingJobId(null);
                        }
                    },
                },
            ],
        );
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await loadJobs();
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                className="flex-1 px-4 pt-14"
                contentContainerStyle={{ paddingBottom: 28 }}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#2a6ff2"
                    />
                }
            >
                <Text className="text-3xl font-Jost-Bold mb-4">Jobs Overview</Text>

                <TextInput
                    placeholder="Search jobs"
                    placeholderTextColor="#6b7280"
                    value={search}
                    onChangeText={setSearch}
                    className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {statusFilters.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setStatus(item)}
                            className={`px-4 py-2 rounded-full h-10 mr-2 ${status === item ? "bg-primary" : "bg-gray-100"}`}
                        >
                            <Text className={`${status === item ? "text-white" : "text-gray-700"} font-Jost-Medium`}>
                                {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading ? (
                    <View className="flex items-center justify-center py-10">
                        <ActivityIndicator size="large" color="#2a6ff2ff" />
                    </View>
                ) : (
                    <>
                        <View className="flex rounded-2xl border border-gray-200 overflow-hidden">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View>
                                    <View className="flex-row bg-gray-100 px-3 py-3">
                                        <Text className="w-44 font-Jost-Bold">Service</Text>
                                        <Text className="w-44 font-Jost-Bold">Customer</Text>
                                        <Text className="w-44 font-Jost-Bold">Provider</Text>
                                        <Text className="w-28 font-Jost-Bold">Budget</Text>
                                        <Text className="w-28 font-Jost-Bold">Status</Text>
                                        <Text className="w-48 font-Jost-Bold">Actions</Text>
                                    </View>

                                    <FlatList
                                        data={jobs}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                        renderItem={({ item }) => (
                                            <View className="flex-row px-3 py-3 border-b border-gray-100">
                                                <Text className="w-44" numberOfLines={2}>{item.service || "—"}</Text>
                                                <Text className="w-44" numberOfLines={2}>{item.customer?.username || "—"}</Text>
                                                <Text className="w-44" numberOfLines={2}>{item.contractor?.username || "—"}</Text>
                                                <Text className="w-28" numberOfLines={2}>Ghc {item.budget || 0}</Text>
                                                <Text className="w-28" numberOfLines={2}>{item.status || "—"}</Text>
                                                <View className="w-48 flex-row items-center gap-2">
                                                    <TouchableOpacity
                                                        onPress={() => openEditJobModal(item)}
                                                        className="px-3 py-1 rounded-full bg-blue-100 self-start"
                                                    >
                                                        <Text className="text-blue-700 font-Jost-Medium">
                                                            Edit
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        disabled={deletingJobId === item.id}
                                                        onPress={() => handleDeleteJob(item)}
                                                        className="px-3 py-1 rounded-full bg-red-100 self-start"
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
                                                <Text className="text-gray-500">No jobs found.</Text>
                                            </View>
                                        }
                                    />
                                </View>
                            </ScrollView>
                        </View>

                        <Button
                            title={exporting ? "Generating PDF report..." : "Download Report as PDF"}
                            onPress={handleExportReport}
                            loading={exporting}
                            disabled={exporting || jobs.length === 0}
                            className="mt-3"
                        />
                    </>
                )}
            </ScrollView>

            <PullableModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                        <Text className="text-xl font-Jost-Bold mb-4">Edit Job</Text>

                        <TextInput
                            placeholder="Service"
                            placeholderTextColor="#6b7280"
                            value={editJobForm.service}
                            onChangeText={(value) =>
                                setEditJobForm((prev) => ({ ...prev, service: value }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />

                        <TextInput
                            placeholder="Budget"
                            placeholderTextColor="#6b7280"
                            value={editJobForm.budget}
                            onChangeText={(value) =>
                                setEditJobForm((prev) => ({ ...prev, budget: value }))
                            }
                            keyboardType="numeric"
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />

                        <TextInput
                            placeholder="Location"
                            placeholderTextColor="#6b7280"
                            value={editJobForm.location}
                            onChangeText={(value) =>
                                setEditJobForm((prev) => ({ ...prev, location: value }))
                            }
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />

                        <TextInput
                            placeholder="Description"
                            placeholderTextColor="#6b7280"
                            value={editJobForm.description}
                            onChangeText={(value) =>
                                setEditJobForm((prev) => ({ ...prev, description: value }))
                            }
                            multiline
                            numberOfLines={3}
                            className="border border-gray-200 rounded-2xl px-4 py-3 mb-3"
                        />

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {editableStatuses.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() =>
                                        setEditJobForm((prev) => ({ ...prev, status: item }))
                                    }
                                    className={`px-3 py-2 rounded-full mr-2 ${
                                        editJobForm.status === item ? "bg-primary" : "bg-gray-100"
                                    }`}
                                >
                                    <Text
                                        className={`${
                                            editJobForm.status === item
                                                ? "text-white"
                                                : "text-gray-700"
                                        } font-Jost-Medium`}
                                    >
                                        {item.replace("_", " ")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setShowEditModal(false)}
                                className="flex-1 border border-gray-300 rounded-2xl py-3 mr-2 items-center"
                            >
                                <Text className="text-gray-700 font-Jost-Bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleUpdateJob}
                                disabled={savingEdit}
                                className="flex-1 bg-primary rounded-2xl py-3 items-center"
                            >
                                <Text className="text-white font-Jost-Bold">
                                    {savingEdit ? "Saving..." : "Save"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                </ScrollView>
            </PullableModal>
        </View>
    );
}
