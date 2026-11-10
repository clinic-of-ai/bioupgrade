import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options: UseAuthOptions = {}) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const me = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
  const availability = trpc.system.authStatus.useQuery(undefined, {
    retry: false,
    staleTime: 30000,
  });
  const logoutMutation = trpc.auth.logout.useMutation();
  const user = me.data ?? null;
  const loading =
    me.isLoading || availability.isLoading || logoutMutation.isPending;
  const configurationError = useMemo(
    () =>
      !user && availability.data?.configured === false
        ? new Error(availability.data.message || "Sign-in is not configured.")
        : null,
    [user, availability.data?.configured, availability.data?.message]
  );

  const refresh = useCallback(() => me.refetch(), [me.refetch]);
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      // A runtime bearer mirror must not resurrect a session after cookies clear.
      try {
        sessionStorage.removeItem("manus-cookie");
        localStorage.removeItem("manus-runtime-user-info");
      } catch {
        /* Storage may be blocked in an embedded browser. */
      }
      queryClient.clear();
      utils.auth.me.setData(undefined, null);
      await utils.invalidate();
    } catch {
      toast.error("Sign-out could not complete. Please try again.");
    }
  }, [logoutMutation.mutateAsync, utils, queryClient]);

  useEffect(() => {
    // Opt-in legacy behavior: no implicit OAuth redirect while auth.me is null.
    // This keeps logged-out/unconfigured account states visible and actionable.
    if (
      options.redirectOnUnauthenticated &&
      !loading &&
      !user &&
      !me.error &&
      typeof window !== "undefined"
    ) {
      const path = options.redirectPath || "/account";
      if (
        path.startsWith("/") &&
        !path.startsWith("//") &&
        window.location.pathname !== path
      ) {
        window.location.assign(path);
      }
    }
  }, [
    options.redirectOnUnauthenticated,
    options.redirectPath,
    loading,
    user,
    me.error,
  ]);

  return {
    user,
    isAuthenticated: Boolean(user),
    loading,
    error:
      me.error ??
      logoutMutation.error ??
      availability.error ??
      configurationError,
    authConfigured: availability.data?.configured ?? false,
    logout,
    refresh,
    login: startLogin,
  };
}
