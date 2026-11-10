/** Preserve the existing analytics integration only when the owner configures both public values. */
const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as
  | string
  | undefined;
if (endpoint && websiteId) {
  try {
    const url = new URL(`${endpoint.replace(/\/+$/, "")}/umami`);
    if (url.protocol === "https:" && !url.username && !url.password) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = url.toString();
      script.dataset.websiteId = websiteId;
      document.head.appendChild(script);
    }
  } catch {
    /* Invalid or absent analytics never prevents loading the application. */
  }
}
export {};
