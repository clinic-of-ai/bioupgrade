#!/usr/bin/env python3
"""Package this recovered source with an integrity manifest, never as deployment proof."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

EXCLUDED_PARTS = {"node_modules", ".git", ".cache", ".local", "__pycache__", ".pytest_cache"}
EXCLUDED_SUFFIXES = {".zip", ".log", ".tsbuildinfo", ".pyc", ".pem", ".key", ".p12", ".pfx"}


def include(path: Path, root: Path) -> bool:
    relative = path.relative_to(root)
    if path.is_symlink() or not path.is_file():
        return False
    if any(part in EXCLUDED_PARTS for part in relative.parts):
        return False
    if path.name.startswith(".env") and path.name != ".env.example":
        return False
    return path.suffix.lower() not in EXCLUDED_SUFFIXES and path.name != "DELIVERY_MANIFEST.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    output = args.output.resolve()
    if output == root or root in output.parents:
        parser.error("Place the archive outside the source directory.")
    output.parent.mkdir(parents=True, exist_ok=True)
    files = sorted(path for path in root.rglob("*") if include(path, root))
    records = []
    with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=6) as archive:
        for path in files:
            data = path.read_bytes()
            relative = path.relative_to(root).as_posix()
            archive.writestr(relative, data)
            records.append({"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
        manifest = {"scope": "applied managed Bioupgrade source; new fresh schema; Shopify live checkout/history linkage pending; publication evidence separate", "files": records, "file_count": len(records)}
        archive.writestr("DELIVERY_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
    required = {"package.json", "pnpm-lock.yaml", ".env.example", "shared/shopify.ts", "shared/community-config.ts", "shared/consulting.ts", "COMMUNITY_CONNECTIONS.md", "COMPETITOR_OPTIONS.md", "CONSULTING_MODEL.md", "SHOPIFY_INTEGRATION_WALKTHROUGH.md", "SHOPIFY_VS_CURRENT_BIOUPGRADE_2026-11-10.md", "MANAGED_DEPLOYMENT_STATUS.md", "VERIFICATION.md", "dist/index.js", "dist/public/index.html"}
    with ZipFile(output) as archive:
        assert archive.testzip() is None, "Archive corruption"
        assert required <= set(archive.namelist()), "Required delivery file missing"
        for item in records:
            assert hashlib.sha256(archive.read(item["path"])).hexdigest() == item["sha256"]
        assert not any(Path(name).name.startswith(".env") and Path(name).name != ".env.example" for name in archive.namelist())
    print(json.dumps({"archive": str(output), "source_files": len(records), "archive_bytes": output.stat().st_size, "archive_sha256": hashlib.sha256(output.read_bytes()).hexdigest(), "integrity": "passed", "services_connected": False}, indent=2))


if __name__ == "__main__":
    main()
