export type UserRole = "customer" | "contractor" | "admin";

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    role: UserRole;
}