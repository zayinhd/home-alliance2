import { supabase } from "@/lib/supabase";

interface CreatePostData {
    service_provider_id: string;
    title: string;
    description: string;
}

const getReviewSummary = (rows: any[] = []) => {
    const reviewMap = new Map<string, { count: number; total: number }>();

    rows.forEach((row) => {
        const providerId = row?.service_provider_id;

        if (!providerId) return;

        const existing = reviewMap.get(providerId) || { count: 0, total: 0 };

        reviewMap.set(providerId, {
            count: existing.count + 1,
            total: existing.total + Number(row?.rating || 0),
        });
    });

    return reviewMap;
};

const isProviderRole = (role?: string | null) => {
    if (!role) return false;

    const normalized = role.replace(/_/g, " ").trim().toLowerCase();

    return (
        normalized === "contractor" ||
        normalized === "service provider" ||
        normalized === "service_provider"
    );
};

//Start for Customers

export const getContractors = async () => {
    const [{ data, error }, { data: reviewRows }] = await Promise.all([
        supabase
            .from("profiles")
            .select(
                `
                    id,
                    username,
                    professions,
                    avatar_url,
                    rating,
                    reviews_count,
                    role
                `,
            )
            .order("rating", {
                ascending: false,
            }),
        supabase.from("reviews").select("service_provider_id, rating"),
    ]);

    if (error) throw error;

    const reviewSummary = getReviewSummary(reviewRows || []);

    return (data || [])
        .filter((item: any) => isProviderRole(item?.role))
        .map((item: any) => {
            const reviewStats = reviewSummary.get(item.id) || { count: 0, total: 0 };
            const count = Number(item.reviews_count ?? reviewStats.count ?? 0);
            const rating =
                count > 0
                    ? Number(
                          reviewStats.total / count,
                      )
                    : Number(item.rating ?? 0);

            return {
                ...item,
                rating: Number(rating.toFixed(1)),
                reviews_count: count,
                profession: Array.isArray(item.professions)
                    ? item.professions[0]
                    : item.professions,
            };
        });
};

export const getContractorById = async (contractorId: string) => {
    const [{ data, error }, { data: reviewRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", contractorId).single(),
        supabase
            .from("reviews")
            .select("service_provider_id, rating")
            .eq("service_provider_id", contractorId),
    ]);

    if (error) throw error;

    const reviewStats = getReviewSummary(reviewRows || []);
    const providerReviewStats = reviewStats.get(contractorId) || {
        count: 0,
        total: 0,
    };
    const reviewCount = Number(data?.reviews_count ?? providerReviewStats.count ?? 0);
    const rating =
        reviewCount > 0
            ? Number((providerReviewStats.total / reviewCount).toFixed(1))
            : Number(data?.rating ?? 0);

    return {
        ...data,
        rating,
        reviews_count: reviewCount,
        profession: Array.isArray(data?.professions)
            ? data.professions[0]
            : data?.professions,
    };
};

export const getContractorReviews = async (contractorId: string) => {
    const { data, error } = await supabase
        .from("reviews")
        .select(
            `
                    *,
                    customer:profiles!reviews_customer_id_fkey(
                        username
                    )
                `,
        )
        .eq("service_provider_id", contractorId)
        .order("created_at", {
            ascending: false,
        });

    if (error) throw error;

    return data;
};
//End for Customers

export const createContractorPost = async ({
    service_provider_id,
    title,
    description,
}: CreatePostData) => {
    const { data, error } = await supabase
        .from("service_provider_posts")
        .insert({
            service_provider_id,
            title,
            description,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};

export const getContractorPosts = async () => {
    const { data, error } = await supabase
        .from("service_provider_posts")
        .select(
            `
                *,
                profiles(
                    username,
                    avatar_url
                )
            `,
        )
        .order("created_at", {
            ascending: false,
        });

    if (error) throw error;

    return data;
};
