// Client-side middleware that attaches the signed-in user's Supabase access
// token to server function requests. Register it as a global `functionMiddleware`
// in src/start.ts; the server validates the token via requireSupabaseAuth.
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
