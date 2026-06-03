import { getSupabaseClient } from "../utils/supabase";

const getClient = () => {
  const client = getSupabaseClient();
  if (!client) {
    // During prerender or when Supabase is not configured,
    // auth is unavailable. Return null-safe responses.
    return null;
  }
  return client;
};

export const getAuthSession = () => {
  const client = getClient();
  if (!client) {
    return Promise.resolve({ data: { session: null }, error: null });
  }
  return client.auth.getSession();
};

export const onAuthStateChange = (
  callback: (
    event: string,
    session: import("@supabase/supabase-js").Session | null,
  ) => void,
) => {
  const client = getClient();
  if (!client) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return client.auth.onAuthStateChange(callback);
};

export const signInWithPassword = (email: string, password: string) => {
  const client = getClient();
  if (!client) {
    return Promise.resolve({
      data: { user: null, session: null },
      error: {
        name: "AuthUnavailable",
        message:
          "Authentication is not configured. Set up Supabase to enable sign-in.",
      },
    });
  }
  return client.auth.signInWithPassword({ email, password });
};

export const signUpWithPassword = (email: string, password: string) => {
  const client = getClient();
  if (!client) {
    return Promise.resolve({
      data: { user: null, session: null },
      error: {
        name: "AuthUnavailable",
        message:
          "Authentication is not configured. Set up Supabase to enable sign-up.",
      },
    });
  }
  return client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
};

export const resetPasswordForEmail = (email: string) => {
  const client = getClient();
  if (!client) {
    return Promise.resolve({
      data: null,
      error: {
        name: "AuthUnavailable",
        message:
          "Authentication is not configured. Set up Supabase to enable password reset.",
      },
    });
  }
  return client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
};

export const signOut = () => {
  const client = getClient();
  if (!client) {
    return Promise.resolve({ error: null });
  }
  return client.auth.signOut();
};
