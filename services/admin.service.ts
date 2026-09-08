import { supabase } from "@/lib/supabase";

const VERIFICATION_BUCKET = "national-registry";

interface CreateAdminUserPayload {
    username: string;
    email: string;
    password: string;
    role: string;
    professions?: string[];
    phone?: string;
    isVerified?: boolean;
}

interface UpdateAdminUserPayload {
    userId: string;
    username: string;
    role: string;
    phone?: string;
    professions?: string[];
    isVerified: boolean;
}

interface UpdateAdminJobPayload {
    jobId: string;
    service: string;
    budget: number;
    status: string;
    location?: string;
    description?: string;
}

export const getDashboardStats = async () => {
    const { count: totalUsers } = await supabase.from("profiles").select("*", {
        count: "exact",
        head: true,
    });

    const { count: totalContractors } = await supabase
        .from("profiles")
        .select("*", {
            count: "exact",
            head: true,
        })
        .in("role", ["contractor", "service_provider", "service provider"]);

    const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", {
            count: "exact",
            head: true,
        })
        .eq("role", "customer");

    const { count: verifiedContractors } = await supabase
        .from("profiles")
        .select("*", {
            count: "exact",
            head: true,
        })
        .eq("is_verified", true);

    const { count: pendingVerifications } = await supabase
        .from("user_verifications")
        .select("*", {
            count: "exact",
            head: true,
        })
        .eq("verification_status", "pending");

    const { data: jobs } = await supabase.from("jobs").select("*");

    const totalRevenue =
        jobs?.reduce((total, job) => total + Number(job.budget || 0), 0) || 0;

    return {
        totalUsers,
        totalCustomers,
        totalContractors,
        verifiedContractors,
        pendingVerifications,
        totalJobs: jobs?.length || 0,
        completedJobs:
            jobs?.filter((j) => j.status === "completed").length || 0,
        pendingJobs: jobs?.filter((j) => j.status === "pending").length || 0,
        cancelledJobs:
            jobs?.filter((j) => j.status === "cancelled").length || 0,
        totalRevenue,
    };
};

export const createAdminUser = async ({
    username,
    email,
    password,
    role,
    professions,
    phone,
    isVerified = false,
}: CreateAdminUserPayload) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                role,
                professions: professions ?? null,
                phone: phone ?? null,
            },
        },
    });

    if (error) throw error;

    if (data.user?.id) {
        const { error: profileError } = await supabase.from("profiles").upsert(
            {
                id: data.user.id,
                username,
                email,
                role,
                professions: professions ?? null,
                phone: phone ?? null,
                is_verified: isVerified,
                verification_status: isVerified ? "verified" : "pending",
            },
            { onConflict: "id" },
        );

        if (profileError) throw profileError;
    }

    return data;
};

export const getAdminJobs = async (status?: string) => {
    let query = supabase.from("jobs").select(`
                    *,
                    customer:profiles!jobs_customer_id_fkey(
                        id,
                        username,
                        phone
                    ),
                    contractor:profiles!jobs_service_provider_id_fkey(
                        id,
                        username,
                        phone,
                        amount_earned
                    )
                `);

    if (status && status !== "all") {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
};

export const getAdminUsers = async (role?: string, search?: string) => {
    let query = supabase.from("profiles").select("*");

    if (role && role !== "all") {
        if (role === "service provider" || role === "service_provider") {
            query = query.in("role", [
                "contractor",
                "service_provider",
                "service provider",
            ]);
        } else {
            query = query.eq("role", role);
        }
    }

    if (search?.trim()) {
        const searchValue = `%${search.trim()}%`;
        query = query.or(
            `username.ilike.${searchValue},email.ilike.${searchValue},phone.ilike.${searchValue}`,
        );
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
};

export const suspendUser = async (userId: string, suspended: boolean) => {
    const { error } = await supabase
        .from("profiles")
        .update({
            is_suspended: suspended,
        })
        .eq("id", userId);

    if (error) throw error;
};

const runBestEffortDelete = async (
    table: string,
    column: string,
    userId: string,
) => {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq(column, userId);

    // Ignore missing-table errors to keep compatibility across environments.
    if (error && error.code !== "42P01") {
        throw error;
    }
};

export const deleteUser = async (userId: string) => {
    // Keep admin delete scoped to user records managed in the Users tab.
    await runBestEffortDelete("notifications", "user_id", userId);
    await runBestEffortDelete("locations", "user_id", userId);

    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) throw error;
};

export const updateAdminUser = async ({
    userId,
    username,
    role,
    phone,
    professions,
    isVerified,
}: UpdateAdminUserPayload) => {
    const { error } = await supabase
        .from("profiles")
        .update({
            username,
            role,
            phone: phone ?? null,
            professions: professions?.length ? professions : null,
            is_verified: isVerified,
            verification_status: isVerified ? "verified" : "pending",
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) throw error;
};

export const updateAdminJob = async ({
    jobId,
    service,
    budget,
    status,
    location,
    description,
}: UpdateAdminJobPayload) => {
    const { error } = await supabase
        .from("jobs")
        .update({
            service,
            budget,
            status,
            location: location ?? "",
            description: description ?? "",
        })
        .eq("id", jobId);

    if (error) throw error;
};

export const deleteAdminJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) throw error;
};

export const getVerificationRequests = async (status?: string) => {
    let query = supabase
        .from("user_verifications")
        .select(
            `
                    *,
                    profile:profiles(
                        id,
                        username,
                        email,
                        phone,
                        is_verified
                    ),
                    registry:national_registry(
                        id,
                        full_name,
                        national_id_number,
                        photo_url
                    )
                `,
        )
        .order("created_at", {
            ascending: false,
        });

    if (status && status !== "all") {
        query = query.eq("verification_status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const requests = data || [];

    const requestsWithSelfies = await Promise.all(
        requests.map(async (item: any) => {
            const userId = item?.profile?.id;

            if (!userId) {
                return {
                    ...item,
                    providerSelfieUrl: null,
                };
            }

            const { data: files, error: listError } = await supabase.storage
                .from(VERIFICATION_BUCKET)
                .list(`${userId}/verifications`, {
                    limit: 1,
                    offset: 0,
                    sortBy: {
                        column: "created_at",
                        order: "desc",
                    },
                });

            if (listError || !files?.length || !files[0]?.name) {
                return {
                    ...item,
                    providerSelfieUrl: null,
                };
            }

            const path = `${userId}/verifications/${files[0].name}`;

            const { data: publicData } = supabase.storage
                .from(VERIFICATION_BUCKET)
                .getPublicUrl(path);

            return {
                ...item,
                providerSelfieUrl: publicData?.publicUrl ?? null,
            };
        }),
    );

    return requestsWithSelfies;
};

export const approveVerification = async (
    verificationId: string,
    userId: string,
) => {
    const { error: verificationError } = await supabase
        .from("user_verifications")
        .update({
            verification_status: "verified",
            verified_at: new Date().toISOString(),
        })
        .eq("id", verificationId);

    if (verificationError) throw verificationError;

    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            is_verified: true,
            verification_status: "verified",
        })
        .eq("id", userId);

    if (profileError) throw profileError;
};

export const rejectVerification = async (
    verificationId: string,
    userId: string,
) => {
    const { error: verificationError } = await supabase
        .from("user_verifications")
        .update({
            verification_status: "failed",
        })
        .eq("id", verificationId);

    if (verificationError) throw verificationError;

    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            is_verified: false,
            verification_status: "failed",
        })
        .eq("id", userId);

    if (profileError) throw profileError;
};

export const clearVerificationRequest = async (
    verificationId: string,
    userId: string,
    registryId: string,
) => {
    const { error: verificationError } = await supabase
        .from("user_verifications")
        .update({
            verification_status: "pending",
            similarity_score: null,
            verified_at: null,
        })
        .eq("id", verificationId);

    if (verificationError) throw verificationError;

    const { error: registryError } = await supabase
        .from("national_registry")
        .update({
            full_name: "",
            national_id_number: "",
            photo_url: "",
        })
        .eq("id", registryId);

    if (registryError) throw registryError;

    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            is_verified: false,
            verification_status: "pending",
        })
        .eq("id", userId);

    if (profileError) throw profileError;
};
