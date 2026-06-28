import { supabase } from "@/lib/supabase";

interface CreatePostData {
    service_provider_id: string;
    title: string;
    description: string;
}

//Start for Customers

export const getContractors = async () => {
    const { data, error } = await supabase
        .from("profiles")
        .select(
            `
                    id,
                    username,
                    professions,
                    avatar_url,
                    rating,
                    reviews_count
                `,
        )
        .in("role", ["contractor", "service_provider", "service provider"])
        .order("rating", {
            ascending: false,
        });

    if (error) throw error;

    return (data || []).map((item: any) => ({
        ...item,
        profession: Array.isArray(item.professions)
            ? item.professions[0]
            : item.professions,
    }));
};

export const getContractorById = async (contractorId: string) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", contractorId)
        .single();

    if (error) throw error;

    return {
        ...data,
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
