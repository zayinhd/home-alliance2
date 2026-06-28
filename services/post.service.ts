import { supabase } from "@/lib/supabase";

interface CreatePostPayload {
    service_provider_id: string;
    title: string;
    description: string;
    status?: string;
}

export const createPost = async ({
    service_provider_id,
    title,
    description,
    status = "published",
}: CreatePostPayload) => {
    const { data, error } = await supabase
        .from("service_provider_posts")
        .insert({
            service_provider_id,
            title,
            description,
            status,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};
