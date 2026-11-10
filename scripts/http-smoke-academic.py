#!/usr/bin/env python3
"""Read-only checks of the local compiled session, not live-service acceptance."""
import json
from pathlib import Path
import urllib.error
import urllib.request

ORIGIN = "http://127.0.0.1:3000"
CHECKS = [
    ("/api/health", 200, None), ("/api/ready", 503, "connectivityVerified"),
    ("/api/trpc/auth.me", 200, None), ("/api/trpc/account.me", 401, None),
    ("/api/missing", 404, None), ("/", 200, "THE ACADEMIC LAYER"),
    ("/research", 200, "10.1172/jci.insight.140532"), ("/meta", 200, "Precision is"),
    ("/community", 200, "manus-no-record"), ("/documentation", 200, "COA"),
    ("/shop", 200, "Tirzepatida"), ("/products", 200, "Research Strategy"),
    ("/book", 200, "Research Strategy Session"), ("/account", 200, "noindex,follow"),
    ("/cart", 200, "loaded privately"),
    ("/book?product=evidence-briefing", 200, "From €850"),
    ("/community#community-network", 200, "THE BIOSCIENCE NETWORK"),
    ("/shop/tirzepatida-25mg-5x5mg-zphc", 200, "€150"),
    ("/shop/mots-c-40mg", 200, "€90"), ("/shop/klow-80mg", 200, "Identity unresolved"),
    ("/shop/missing-compound", 404, "noindex,follow"),
    ("/missing-page", 404, "not in the record"), ("/assets/not-found.js", 404, None),
    ("/manus-routes.json", 200, "/research"),
    ("/images/research/semaglutide-structure.png", 200, None),
    ("/images/research/lab-glassware.webp", 200, None),
    ("/images/research/tirze-25mg-reference.webp", 200, None),
    ("/robots.txt", 200, "Disallow: /"),
    ("/sitemap.xml", 200, "<urlset"),
    ("/manus-storage/planhat-reference-hero_ee4ad5e3.webp", 403, None),
]


def main():
    results = []
    for endpoint, expected, marker in CHECKS:
        try:
            response = urllib.request.urlopen(ORIGIN + endpoint, timeout=15)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            status = response.status
            content_type = response.headers.get("Content-Type", "")
            data = response.read()
        text = data.decode("utf-8", "replace") if not content_type.startswith("image/") else ""
        assert status == expected, (endpoint, status, expected, text[:100])
        assert not marker or marker.casefold() in text.casefold(), (endpoint, "missing marker", marker)
        if endpoint.startswith("/api/"):
            assert "application/json" in content_type, (endpoint, "API was not JSON")
        if endpoint == "/account":
            assert '<div id="root"></div>' in text, "Unexpected private SSR account content"
        if endpoint == "/research":
            assert '<div id="root"></div>' not in text, "Research initial HTML was not populated"
        if endpoint == "/manus-routes.json":
            assert len(json.loads(text)["routes"]) == 37
            assert any(route["path"] == "/cart" for route in json.loads(text)["routes"])
        results.append({"path": endpoint, "http": status, "contentType": content_type, "markerChecked": marker})
        print(f"{status} {endpoint}", flush=True)
    output = Path(__file__).resolve().parents[1] / "LOCAL_HTTP_SMOKE.json"
    output.write_text(json.dumps({"origin": "local session, not production", "checks": results, "passed": len(results), "servicesConnected": False}, indent=2) + "\n")
    print(f"Passed {len(results)} read-only HTTP checks; original services remain unconnected.")


if __name__ == "__main__":
    main()
