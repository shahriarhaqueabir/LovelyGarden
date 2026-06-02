import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

const mockSupabase = {
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
  },
};

vi.mock("../../utils/supabase", () => ({
  supabase: mockSupabase,
  getSupabaseClient: () => mockSupabase,
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAuthSession delegates to supabase", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    const { getAuthSession } = await import("../authService");
    const result = await getAuthSession();
    expect(mockGetSession).toHaveBeenCalledOnce();
    expect(result.data.session).toBeNull();
  });

  it("signInWithPassword calls supabase with credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    const { signInWithPassword } = await import("../authService");
    const result = await signInWithPassword("test@example.com", "password123");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.data.user?.id).toBe("u-1");
  });

  it("signUpWithPassword calls supabase with email and password", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "u-2" } },
      error: null,
    });
    const { signUpWithPassword } = await import("../authService");
    const result = await signUpWithPassword("new@example.com", "secure123");
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "secure123",
      options: { emailRedirectTo: window.location.origin },
    });
    expect(result.data.user?.id).toBe("u-2");
  });

  it("signOut calls supabase signOut", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const { signOut } = await import("../authService");
    await signOut();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("onAuthStateChange registers callback", async () => {
    const callback = () => {};
    const { onAuthStateChange } = await import("../authService");
    onAuthStateChange(callback);
    expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
  });
});
