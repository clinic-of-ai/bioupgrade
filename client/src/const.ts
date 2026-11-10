import { toast } from "sonner";
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
export const APP_SESSION_COOKIE = "webdev_app_session";

let loginInFlight = false;

/** Call only from an event handler/effect, never during render. The server
 * creates the short-lived HttpOnly nonce; the browser never writes auth state.
 * Missing config/network errors are visible and resolve false, never crash UI.
 */
export async function startLogin(): Promise<boolean> {
  if (typeof window === "undefined" || loginInFlight) return false;
  loginInFlight = true;
  try {
    const response = await fetch("/api/oauth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ origin: window.location.origin }),
    });
    const data = (await response.json().catch(() => null)) as {
      authorizationUrl?: string;
      error?: string;
    } | null;
    if (!response.ok || !data?.authorizationUrl) {
      toast.error(
        data?.error ||
          "Sign-in is currently unavailable. Please try again later."
      );
      return false;
    }
    const url = new URL(data.authorizationUrl);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    ) {
      toast.error("Sign-in returned an invalid authorization address.");
      return false;
    }
    window.location.assign(url.toString());
    return true;
  } catch {
    toast.error(
      "Sign-in could not start. Check your connection or try again later."
    );
    return false;
  } finally {
    loginInFlight = false;
  }
}
