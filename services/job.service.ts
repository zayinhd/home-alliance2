import { supabase } from "@/lib/supabase";
import { createNotification } from "@/services/notification.service";

interface CreateBookingPayload {
    customerId: string;
    serviceProviderId: string;
    service: string;
    budget: number;
    location?: string;
    description?: string;
}

export const getContractorStats = async (userId: string) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("username, professions, rating, jobs_completed, amount_earned")
        .eq("id", userId)
        .single();

    if (error) throw error;

    return {
        username: data?.username ?? "Contractor",
        profession: Array.isArray(data?.professions)
            ? data.professions[0]
            : (data?.professions ?? "Contractor"),
        rating: data?.rating ?? 0,
        jobs_completed: Number(data?.jobs_completed ?? 0),
        amount_earned: Number(data?.amount_earned ?? 0),
    };
};

export const getOngoingJobs = async (userId: string) => {
    const { data, error } = await supabase
        .from("jobs")
        .select("*, customer:profiles!jobs_customer_id_fkey(username)")
        .eq("service_provider_id", userId)
        .in("status", ["pending", "accepted", "in_progress"])
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((job: any) => ({
        ...job,
        customer: job.customer ?? { username: "Customer" },
    }));
};

export const acceptJob = async (jobId: string) => {
    const { error } = await supabase
        .from("jobs")
        .update({ status: "accepted" })
        .eq("id", jobId);

    if (error) throw error;
};

export const createBooking = async ({
    customerId,
    serviceProviderId,
    service,
    budget,
    location,
    description,
}: CreateBookingPayload) => {
    const { data, error } = await supabase
        .from("jobs")
        .insert({
            customer_id: customerId,
            service_provider_id: serviceProviderId,
            service,
            budget,
            location: location ?? "",
            description: description ?? "",
            status: "pending",
        })
        .select()
        .single();

    if (error) throw error;

    await Promise.all([
        createNotification({
            userId: serviceProviderId,
            title: "Job Request Received",
            message: `New booking request for ${service}.`,
        }),
        createNotification({
            userId: customerId,
            title: "Booking Sent",
            message: `Your booking request for ${service} has been sent.`,
        }),
    ]);

    return data;
};

export const getCustomerBookings = async (
    customerId: string,
    status: string = "all",
) => {
    let query = supabase
        .from("jobs")
        .select(
            `
            *,
            service_provider:profiles!jobs_service_provider_id_fkey(
                id,
                username,
                phone,
                professions,
                rating,
                avatar_url
            )
        `,
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

    if (status !== "all") {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
};

export const getServiceProviderBookings = async (
    serviceProviderId: string,
    status: string = "all",
) => {
    let query = supabase
        .from("jobs")
        .select(
            `
            *,
            customer:profiles!jobs_customer_id_fkey(
                id,
                username,
                phone,
                avatar_url
            )
        `,
        )
        .eq("service_provider_id", serviceProviderId)
        .order("created_at", { ascending: false });

    if (status !== "all") {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
};

export const updateJobStatus = async (
    jobId: string,
    status: "accepted" | "cancelled" | "completed" | "in_progress",
) => {
    const { data: existingJob, error: existingJobError } = await supabase
        .from("jobs")
        .select("status, budget, service_provider_id")
        .eq("id", jobId)
        .single();

    if (existingJobError) throw existingJobError;

    const { data, error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId)
        .select()
        .single();

    if (error) throw error;

    const { data: jobMeta } = await supabase
        .from("jobs")
        .select(
            `
            id,
            service,
            customer_id,
            service_provider_id,
            customer:profiles!jobs_customer_id_fkey(username,phone),
            service_provider:profiles!jobs_service_provider_id_fkey(username,phone)
        `,
        )
        .eq("id", jobId)
        .single();

    if (jobMeta?.customer_id && jobMeta?.service_provider_id) {
        const providerProfile = Array.isArray(jobMeta.service_provider)
            ? jobMeta.service_provider[0]
            : jobMeta.service_provider;
        const customerProfile = Array.isArray(jobMeta.customer)
            ? jobMeta.customer[0]
            : jobMeta.customer;

        const serviceName = jobMeta.service || "your service";
        const providerPhone = providerProfile?.phone || "";
        const customerPhone = customerProfile?.phone || "";

        if (status === "accepted") {
            await Promise.all([
                createNotification({
                    userId: jobMeta.customer_id,
                    title: "Booking Accepted",
                    message: `${providerProfile?.username || "Your provider"} accepted your booking for ${serviceName}.`,
                }),
                createNotification({
                    userId: jobMeta.service_provider_id,
                    title: "Booking Accepted",
                    message: `You accepted ${customerProfile?.username || "customer"}'s booking for ${serviceName}.`,
                }),
            ]);
        }

        if (status === "cancelled") {
            await Promise.all([
                createNotification({
                    userId: jobMeta.customer_id,
                    title: "Booking Cancelled",
                    message: `Your booking for ${serviceName} was cancelled.`,
                }),
                createNotification({
                    userId: jobMeta.service_provider_id,
                    title: "Booking Cancelled",
                    message: `You cancelled the booking for ${serviceName}.`,
                }),
            ]);
        }

        if (status === "in_progress") {
            await Promise.all([
                createNotification({
                    userId: jobMeta.customer_id,
                    title: "Service Provider Has Reached Your Location",
                    message: `Your provider is on-site for ${serviceName}. Call now: ${providerPhone || "Unavailable"}`,
                }),
                createNotification({
                    userId: jobMeta.service_provider_id,
                    title: "You Have Reached Customer Location",
                    message: `You marked arrival for ${serviceName}. Call now: ${customerPhone || "Unavailable"}`,
                }),
            ]);
        }

        if (status === "completed") {
            if (existingJob?.status !== "completed") {
                const completionReward = Number(existingJob?.budget || 0);

                const { data: providerStats, error: providerStatsError } =
                    await supabase
                        .from("profiles")
                        .select("amount_earned, jobs_completed")
                        .eq("id", jobMeta.service_provider_id)
                        .single();

                if (providerStatsError) throw providerStatsError;

                const updatedAmount =
                    Number(providerStats?.amount_earned || 0) + completionReward;
                const updatedCompletedJobs =
                    Number(providerStats?.jobs_completed || 0) + 1;

                const { error: providerEarningsError } = await supabase
                    .from("profiles")
                    .update({
                        amount_earned: updatedAmount,
                        jobs_completed: updatedCompletedJobs,
                    })
                    .eq("id", jobMeta.service_provider_id);

                if (providerEarningsError) throw providerEarningsError;
            }

            await Promise.all([
                createNotification({
                    userId: jobMeta.customer_id,
                    title: "Job Completed",
                    message: `${serviceName} has been marked completed. Please leave a review.`,
                }),
                createNotification({
                    userId: jobMeta.service_provider_id,
                    title: "Job Completed",
                    message: `You completed ${serviceName} successfully.`,
                }),
            ]);
        }
    }

    return data;
};

export const submitJobReview = async (
    customerId: string,
    serviceProviderId: string,
    rating: number,
    comment: string,
) => {
    const { data, error } = await supabase
        .from("reviews")
        .insert({
            customer_id: customerId,
            service_provider_id: serviceProviderId,
            rating,
            comment,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;

    const { data: reviewRows, error: reviewFetchError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("service_provider_id", serviceProviderId);

    if (reviewFetchError) throw reviewFetchError;

    const reviewCount = reviewRows?.length || 0;
    const totalRating = reviewRows.reduce(
        (sum, row) => sum + (Number(row.rating) || 0),
        0,
    );
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    const normalizedRating = Number(averageRating.toFixed(1));

    const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
            rating: normalizedRating,
            reviews_count: reviewCount,
        })
        .eq("id", serviceProviderId);

    if (profileUpdateError) throw profileUpdateError;

    await createNotification({
        userId: serviceProviderId,
        title: "New Rating Received",
        message: `You received a ${rating}/5 review from a customer.`,
    });

    return data;
};
