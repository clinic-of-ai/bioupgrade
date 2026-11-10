import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import superjson from "superjson";
import App from "./App";
import { APP_SESSION_COOKIE } from "./const";
import "./index.css";

const queryClient = new QueryClient();
function showAuthError(error: unknown) {
  if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
    // Do not launch OAuth from background query errors or enter redirect loops.
    toast.error("Please sign in from Account to continue.", {
      id: "sign-in-required",
    });
  }
}
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error")
    showAuthError(event.query.state.error);
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error")
    showAuthError(event.mutation.state.error);
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview can supply a bearer mirror when iframe cookies are blocked.
        // This is untrusted input until HS256/project/expiry validation on server.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            for (const name of [APP_SESSION_COOKIE, COOKIE_NAME]) {
              const pair = raw
                .split(";")
                .find(value => value.trim().startsWith(`${name}=`));
              const encoded = pair?.trim().slice(name.length + 1);
              const token = encoded ? decodeURIComponent(encoded) : "";
              if (token && !/[\r\n]/.test(token))
                return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          /* Session storage or a malformed mirror may be unavailable. */
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
