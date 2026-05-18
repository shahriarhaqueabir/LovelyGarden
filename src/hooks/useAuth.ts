import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthSession, onAuthStateChange } from "../services/authService";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;

    getAuthSession().then(({ data }) => {
      if (!mounted) return;
      setState({
        loading: false,
        session: data.session,
        user: data.session?.user ?? null,
      });
    });

    const {
      data: { subscription },
    } = onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setState({
        loading: false,
        session,
        user: session?.user ?? null,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
};
