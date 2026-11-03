import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    // Check whether the user is authenticated
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }

    // Verify that the authenticated user is an authorized owner
    const { data: isOwner, error: ownerError } =
      await supabase.rpc("claim_owner");

    if (ownerError || isOwner !== true) {
      throw redirect({ to: "/" });
    }

    return { user: data.user };
  },

  component: () => <Outlet />,
});