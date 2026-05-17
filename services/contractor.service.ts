import { supabase } from "@/lib/supabase";

interface CreatePostData {
    contractor_id: string;
    title: string;
    description: string;
}

export const createContractorPost = async ({
    contractor_id,
    title,
    description,
}: CreatePostData) => {
    const { data, error } =
        await supabase
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
    const { data, error } =
        await supabase
            .from("contractor_posts")
            .select(`
                *,
                profiles(
                    username,
                    avatar_url
                )
            `)
            .order("created_at", {
                ascending: false,
            });

    if (error) throw error;

    return data;
};