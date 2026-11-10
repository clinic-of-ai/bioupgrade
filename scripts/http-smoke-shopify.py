#!/usr/bin/env python3
"""Read-only/fail-closed checks for this locked-channel local session, not production acceptance."""
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
ORIGIN = "http://127.0.0.1:3000"
def request(path, method="GET", body=None, origin=None):
    headers = {"Accept": "application/json"}
    if body is not None: headers["Content-Type"] = "application/json"
    if origin: headers["Origin"] = origin
    try:
        response = urlopen(Request(ORIGIN + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method), timeout=15)
    except HTTPError as error:
        response = error
    with response:
        return response.status, json.loads(response.read())
checks = []
status, health = request("/api/health")
assert status == 200 and health["commerceProvider"] == "shopify"
assert health["shopify"]["accountLinkageImplemented"] is False
checks.append({"case":"selected provider and unimplemented account linkage", "http":status})
status, catalogue = request("/api/shopify/catalog")
assert status == 200 and catalogue["status"] == "unavailable" and catalogue["products"] == []
assert not catalogue["cartEnabled"] and not catalogue["checkoutEnabled"]
assert "gid://shopify/Cart" not in json.dumps(catalogue)
checks.append({"case":"real locked-channel catalogue unavailable", "http":status, "status":catalogue["status"]})
status, cart = request("/api/shopify/cart")
assert status in (200, 503) and cart.get("cart") is None
assert not cart.get("checkoutEnabled", False)
assert "gid://shopify/Cart" not in json.dumps(cart)
checks.append({"case":"no invented guest cart or checkout", "http":status})
status, _ = request("/api/shopify/cart", "POST", {"action":"clear"}, "https://untrusted.example.test")
assert status == 403
checks.append({"case":"reject foreign-origin mutation", "http":status})
status, _ = request("/api/shopify/checkout", "POST", {}, "https://untrusted.example.test")
assert status == 403
checks.append({"case":"reject foreign-origin checkout", "http":status})
output = {"scope":"locked-channel local session only; no cart/order/payment created", "passed":len(checks), "checks":checks, "liveCartVerified":False, "published":False}
path = Path(__file__).resolve().parents[1] / "LOCAL_SHOPIFY_HTTP_SMOKE.json"
path.write_text(json.dumps(output, indent=2) + "\n")
print(json.dumps(output, indent=2))
