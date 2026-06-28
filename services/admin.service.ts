import { supabase } from "@/lib/supabase";

interface CreateAdminUserPayload {
    username: string;
    email: string;
    password: string;
    role: string;
    professions?: string[];
    phone?: string;
    isVerified?: boolean;
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

export const deleteUser = async (userId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);

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

    return data || [];
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
