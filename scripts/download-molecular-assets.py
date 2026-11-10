#!/usr/bin/env python3
"""Retrieve named-entity 2D diagrams, not supplier-product authentication.

Uses documented PubChem PUG REST name/CID/synonym/PNG endpoints; <=5req/sec,
11 targeted names, no pagination or ambiguous-CID selection. Each result records
access date, query, CID and source. Existing owner-specific image entries survive.
"""
from pathlib import Path
from urllib.parse import quote
import datetime
import json
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "client/public/images/research"
DATA = ROOT / "shared/product-image-data.json"
AUDIT = ROOT / "MOLECULAR_IMAGE_PROVENANCE.json"
BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
TARGETS = {
    "tirzepatide": "tirzepatide", "semaglutide": "semaglutide",
    "ghk-cu": "GHK-Cu", "tesamorelin": "tesamorelin",
    "sermorelin": "sermorelin", "mots-c": "MOTS-c",
    "ss31": "elamipretide", "epithalon": "epitalon",
    "oxytocin": "oxytocin", "dsip": "DSIP", "glutathione": "glutathione",
}

def request(url, binary=False):
    time.sleep(0.3)
    req = urllib.request.Request(url, headers={"User-Agent": "BioupgradeResearchAssets/1.0", "Accept": "image/png" if binary else "application/json"})
    with urllib.request.urlopen(req, timeout=18) as response:
        data = response.read(4_000_000)
        if binary:
            if not data.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValueError("Response was not a PNG")
            return data
        return json.loads(data)


def normal(value):
    return "".join(c for c in value.casefold() if c.isalnum())


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    images = json.loads(DATA.read_text()) if DATA.exists() else {}
    audit = []
    for family, name in TARGETS.items():
        row = {"family": family, "query": name, "accessDate": datetime.date.today().isoformat(), "endpoints": [], "status": "not retrieved"}
        try:
            url = f"{BASE}/compound/name/{quote(name, safe='')}/cids/JSON"
            row["endpoints"].append(url)
            result = request(url)
            cids = result.get("IdentifierList", {}).get("CID", [])
            row["returnedCount"] = len(cids)
            if len(cids) != 1 or not isinstance(cids[0], int) or cids[0] <= 0:
                raise ValueError("No unique CID; refusing ambiguous selection")
            cid = cids[0]
            row["cid"] = cid
            url = f"{BASE}/compound/cid/{cid}/synonyms/JSON"
            row["endpoints"].append(url)
            synonyms = request(url).get("InformationList", {}).get("Information", [{}])[0].get("Synonym", [])
            if normal(name) not in {normal(s) for s in synonyms}:
                raise ValueError("Requested name was not verified in CID synonyms")
            url = f"{BASE}/compound/cid/{cid}/PNG?image_size=300x300"
            row["endpoints"].append(url)
            png = request(url, binary=True)
            filename = f"{family}-structure.png"
            (ASSETS / filename).write_bytes(png)
            images[family] = {
                "src": f"/images/research/{filename}",
                "alt": f"PubChem 2D molecular structure of the named entity {name}, CID {cid}.",
                "caption": "Molecular structure of the named research entity · not a product photograph or batch verification.",
                "sourceUrl": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}",
                "credit": f"PubChem / NCBI · CID {cid}",
                "type": "molecular structure",
            }
            row["status"] = "retrieved, unique name/CID match"
            row["asset"] = filename
            print(f"{family}: retrieved CID {cid}", flush=True)
        except (urllib.error.URLError, ValueError, KeyError, IndexError) as error:
            row["status"] = "skipped"
            row["reason"] = str(error)[:180]
            print(f"{family}: skipped ({row['reason']})", flush=True)
        audit.append(row)
    DATA.write_text(json.dumps(images, ensure_ascii=False, indent=2) + "\n")
    AUDIT.write_text(json.dumps({"scope": "11 targeted names; unique CID and exact normalized synonym required; no inferred blend/component identity", "results": audit, "retrieved": sum(r["status"].startswith("retrieved") for r in audit)}, indent=2) + "\n")

if __name__ == "__main__":
    main()
