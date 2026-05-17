import { supabase } from "@/lib/supabase";

interface SignUpData {
    username: string;
    email: string;
    password: string;
    role: "customer" | "contractor";
}

export const signUp = async ({
    username,
    email,
    password,
    role,
}: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                role,
            },
        },
    });

    if (error) throw error;

    return data;
};

export const signIn = async (
    email: string,
    password: string
) => {
    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password,
        });

    if (error) throw error;

    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
};