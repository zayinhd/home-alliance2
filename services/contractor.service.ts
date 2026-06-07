import { supabase } from "@/lib/supabase";

interface CreatePostData {
    contractor_id: string;
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
                    profession,
                    avatar_url,
                    rating,
                    reviews_count
                `,
        )
        .eq("role", "contractor")
        .order("rating", {
            ascending: false,
        });

    if (error) throw error;

    return data;
};

export const getContractorById = async (contractorId: string) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", contractorId)
        .single();

    if (error) throw error;

    return data;
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
        .eq("contractor_id", contractorId)
        .order("created_at", {
            ascending: false,
        });

    if (error) throw error;

    return data;
};
//End for Customers

export const createContractorPost = async ({
    contractor_id,
    title,
    description,
}: CreatePostData) => {
    const { data, error } = await supabase
        .from("contractor_posts")
        .insert({
            contractor_id,
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
        .from("contractor_posts")
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
