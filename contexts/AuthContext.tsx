import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: string | null;
}

const AuthContext =
    createContext<AuthContextType | null>(null);

export const AuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] =
        useState<Session | null>(null);

    const [loading, setLoading] = useState(true);

    const [role, setRole] = useState<string | null>(
        null
    );

    useEffect(() => {
        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    setRole(
                        session.user.user_metadata.role
                    );
                }

                setLoading(false);
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    setRole(
                        session.user.user_metadata.role
                    );
                } else {
                    setRole(null);
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                role,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuthContext must be used inside AuthProvider"
        );
    }

    return context;
};