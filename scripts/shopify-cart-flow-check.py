#!/usr/bin/env python3
"""Exercise guest cart add/update/reload/remove + checkout handoff through the HTTPS Preview.
Never submits checkout, never prints cookies, cart IDs or the full checkout URL."""
import re, sys, json, urllib.parse
import requests

import os
PREVIEW = "https://8328-imxi6ui7yh6q17e1c2f9x-b5eeafb4.us5.manus.computer"
BASE = sys.argv[1] if len(sys.argv) > 1 else PREVIEW
ORIGIN = os.environ.get("CHECK_ORIGIN", BASE)
s = requests.Session()
H = {"Origin": ORIGIN, "Content-Type": "application/json"}
results = []

def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS" if cond else "FAIL"), name, detail)

cat = s.get(f"{BASE}/api/shopify/catalog", timeout=30).json()
products = cat.get("products", [])
check("catalogue connected", cat.get("status") == "connected", f"{len(products)} products")

def variant_of(pid):
    for p in products:
        if p.get("id") == pid:
            vs = p.get("variants") or (p.get("variants", {}) or {}).get("nodes") or []
            if isinstance(vs, dict): vs = vs.get("nodes", [])
            if vs: return vs[0]["id"], p.get("title")
            if p.get("variantId"): return p["variantId"], p.get("title")
    return None, None

approved_var, approved_title = variant_of("gid://shopify/Product/10996820869458")
blocked_var, blocked_title = variant_of("gid://shopify/Product/10996822278482")
check("variant ids resolved", approved_var and blocked_var, f"{approved_title} / {blocked_title}")
if not approved_var:
    print(json.dumps(products[:1], indent=1)[:1500]); sys.exit(1)

r = s.post(f"{BASE}/api/shopify/cart", json={"action": "add", "merchandiseId": approved_var, "quantity": 1}, headers={"Content-Type": "application/json"}, timeout=30)
check("mutation without Origin rejected", r.status_code in (400, 403), str(r.status_code))

r = s.post(f"{BASE}/api/shopify/cart", json={"action": "add", "merchandiseId": approved_var, "quantity": 1}, headers=H, timeout=30)
body = r.json()
check("add approved service", r.status_code == 200 and body.get("cart"), str(r.status_code))
setc = r.headers.get("set-cookie", "")
secure_expected = BASE.startswith("https://")
check("cart cookie HttpOnly (+__Host-/Secure/SameSite=None on HTTPS)", "HttpOnly" in setc and (not secure_expected or ("__Host-" in setc and "Secure" in setc and "SameSite=None" in setc)))
lines = (body.get("cart") or {}).get("lines", [])
line_id = lines[0]["id"] if lines else None
check("line handle opaque", line_id and re.fullmatch(r"sl_[A-Za-z0-9_-]{43}", line_id))

r = s.post(f"{BASE}/api/shopify/cart", json={"action": "update", "lineId": line_id, "quantity": 2}, headers=H, timeout=30)
q = sum(l.get("quantity", 0) for l in (r.json().get("cart") or {}).get("lines", []))
check("update quantity to 2", r.status_code == 200 and q == 2, f"qty={q}")

r = s.get(f"{BASE}/api/shopify/cart", timeout=30).json()
q = sum(l.get("quantity", 0) for l in (r.get("cart") or {}).get("lines", []))
check("reload keeps cart", q == 2 and r.get("checkoutEnabled") is True, f"qty={q}")

r = s.post(f"{BASE}/api/shopify/checkout", headers=H, timeout=30)
url = r.json().get("url", "")
u = urllib.parse.urlparse(url)
check("checkout handoff returns Shopify URL", r.status_code == 200 and u.scheme == "https" and u.netloc, f"{u.netloc}{u.path[:20]}...")
if url:
    g = requests.get(url, timeout=30, allow_redirects=True)
    final = urllib.parse.urlparse(g.url)
    pw = "/password" in final.path
    print(f"INFO checkout page GET -> {g.status_code} host={final.netloc} path_start={final.path[:24]} password_wall={pw}")

r = s.post(f"{BASE}/api/shopify/cart", json={"action": "add", "merchandiseId": blocked_var, "quantity": 1}, headers=H, timeout=30)
r2 = s.post(f"{BASE}/api/shopify/checkout", headers=H, timeout=30)
check("unapproved service blocks checkout", r2.status_code == 403 and r2.json().get("error") == "SERVICE_NOT_APPROVED", f"{r.status_code}/{r2.status_code}")

cart = s.get(f"{BASE}/api/shopify/cart", timeout=30).json().get("cart") or {}
for l in cart.get("lines", []):
    s.post(f"{BASE}/api/shopify/cart", json={"action": "remove", "lineId": l["id"]}, headers=H, timeout=30)
cart = s.get(f"{BASE}/api/shopify/cart", timeout=30).json().get("cart") or {}
check("remove empties cart", not cart.get("lines"))

print(f"\n{sum(ok for _, ok in results)}/{len(results)} passed; no order submitted, no payment taken.")
