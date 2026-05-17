import { UserRole } from "./auth.types";

export interface Profile {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    role: UserRole;
    created_at: string;
}