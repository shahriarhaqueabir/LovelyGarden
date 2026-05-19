import { supabase } from "../utils/supabase";

export const getAuthSession = () => supabase.auth.getSession();

export const onAuthStateChange = (
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) => supabase.auth.onAuthStateChange(callback);

export const signInWithPassword = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithPassword = (email: string, password: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

export const signOut = () => supabase.auth.signOut();
