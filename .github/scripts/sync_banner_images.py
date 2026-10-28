"""Fetch the most recent EN banner image of each of the 13 banner types (author, 2026-10-10: "EN, most recent of
each type") from arknights.wiki.gg, and save them where the BANNERS page loads them from.

Source: the wiki's banner lists, Headhunting/Banners/<year> (one {{Banners cell}} per banner, with its type and
Global start date), and the wiki's own rule for a banner's image file name (Template:Banners cell): EN_<name>_banner.png.
The wiki's API is free and needs no key; this asks it a few questions and waits a second between them.

Writes, for each type, <slug>.webp (640 px wide, quality 82: the only file the page loads) and banners.json (which
banner each image is, its dates, and the wiki file it came from) into
  - the author's site repo:  C:/Users/User/Documents/GitHub/lemonwait.github.io/doc/banners/  (the page's real source)
  - banners/proto/.img/      (a local copy so the preview on localhost shows them; not committed; also keeps the
    wiki's original <slug>.png)
A type's files are written only when its banner changed (name or Global start date differ from banners.json, or its
webp is missing), so an unchanged banner never shows up as a change in the site repo.

Run:  python banners/sync_banner_images.py            (re-run whenever a new banner of some type has started on Global)
      python banners/sync_banner_images.py --dry-run  (only print what it would fetch)
      python banners/sync_banner_images.py --out doc/banners   (write only to this folder: the site repo's daily
                                                                GitHub Action runs it this way)
"""
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

API = "https://arknights.wiki.gg/api.php"
UA = "redalurk-handbook-banners/1.0 (fan handbook for new players; github.com/lemonwait)"
HERE = Path(__file__).resolve().parent
SITE = Path("C:/Users/User/Documents/GitHub/lemonwait.github.io/doc/banners")
LOCAL = HERE / "proto" / ".img"

# The sheet's 13 banner types (BANNERS tab, row 5), in the sheet's order, and how each one appears on the wiki.
# Celebration is one wiki type for two sheet types: the half-year one starts in November on CN, the anniversary one
# in May (checked against the wiki's 2025-2026 lists). The two Recollection rows are read as the wiki's "linkup" and
# "kernel linkup" banners (the CN new-year banners; the sheet: "ตู้ปีใหม่ของเซิร์ฟจีน/ตู้เก็บตก").
TYPES = [
    ("special",               "Special",               lambda c: c["type"] == "special"),
    ("duo",                   "Duo",                   lambda c: c["type"] == "standard"),
    ("orienteering",          "Orienteering",          lambda c: c["type"] == "orient"),
    ("joint-operation",       "Joint Operation",       lambda c: c["type"] == "jo"),
    ("summer",                "Summer",                lambda c: c["type"] == "carnival"),
    ("celebration-half-year", "Celebration",           lambda c: c["type"] == "celebration" and c.get("cnmonth") == 11),
    ("sui",                   "Sui",                   lambda c: c["type"] == "festival"),
    ("celebration",           "Celebration",           lambda c: c["type"] == "celebration" and c.get("cnmonth") == 5),
    ("collab",                "Collab",                lambda c: c["type"] == "crossover"),
    ("kernel",                "Kernel",                lambda c: c["type"] == "kernel"),
    ("kernel-locating",       "Kernel Locating",       lambda c: c["type"] == "kernel locating"),
    ("standard-recollection", "Standard Recollection", lambda c: c["type"] == "linkup"),
    ("kernel-recollection",   "Kernel Recollection",   lambda c: c["type"] == "kernel linkup"),
]


def api(**params):
    params["format"] = "json"
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    time.sleep(1)  # be polite to a free service
    return data


def date(s):
    s = (s or "").strip()
    for fmt in ("%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


def cells(year):
    """Every {{Banners cell}} on Headhunting/Banners/<year>, as a dict of its parameters."""
    try:
        text = api(action="parse", page=f"Headhunting/Banners/{year}", prop="wikitext")["parse"]["wikitext"]["*"]
    except KeyError:
        return []
    out = []
    for block in re.findall(r"\{\{Banners cell(.*?)\}\}", text, re.S):
        c = {}
        for m in re.finditer(r"\|\s*([a-z ]+?)\s*=\s*([^|]*)", block):
            c[m.group(1).strip()] = m.group(2).strip()
        c["type"] = c.get("type", "standard")
        c["start"] = date(c.get("globalstart") or c.get("start"))
        cn = date(c.get("cnstart"))
        c["cnmonth"] = cn.month if cn else None
        out.append(c)
    return out


def image_name(c):
    """The wiki's own rule (Template:Banners cell) for a banner's image name, EN server."""
    t, no, name = c["type"], c.get("no", ""), c.get("image") or c.get("imgtitle") or c.get("name", "")
    base = {
        "standard": f"Standard Pool {no}", "kernel": f"Kernel {no}", "kernel locating": f"Kernel Locating {no}",
        "rerun": f"{name} Rerun", "limited rerun": f"{name} Rerun", "crossover rerun": f"{name} Rerun",
        "jo": f"Joint Operation {no}", "tftw": f"The Front That Was {no}", "orient": f"Orienteering {no}",
        "kernel linkup": f"{name} {no}",
    }.get(t, name)
    return f"EN {base} banner.png"


def main():
    dry = "--dry-run" in sys.argv
    # --out DIR: write only there (the site repo's Action); otherwise the site repo and the local preview copy
    folders = [Path(sys.argv[sys.argv.index("--out") + 1])] if "--out" in sys.argv else [SITE, LOCAL]
    old = {}
    for folder in folders:
        f = folder / "banners.json"
        old[folder] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    now = datetime.now()
    found = [c for y in range(now.year, now.year - 3, -1) for c in cells(y)]
    started = [c for c in found if c["start"] and c["start"] <= now]  # most recent that has begun on Global
    manifest = {f: dict(m) for f, m in old.items()}  # a type not found this time keeps its old entry
    missing, changed = [], []
    for slug, sheet_name, match in TYPES:
        hits = sorted((c for c in started if match(c)), key=lambda c: c["start"], reverse=True)
        picked = None
        for c in hits:  # the newest whose EN image exists on the wiki
            file = image_name(c)
            info = api(action="query", titles="File:" + file, prop="imageinfo", iiprop="url|size")
            page = next(iter(info["query"]["pages"].values()))
            if "imageinfo" in page:
                picked = (c, file, page["imageinfo"][0])
                break
        if not picked:
            missing.append(sheet_name)
            print(f"  {sheet_name:22} no EN banner image found")
            continue
        c, file, ii = picked
        title = c.get("name") or file[3:-11]
        entry = {"type": sheet_name, "banner": title, "global_start": f"{c['start']:%Y-%m-%d}",
                 "wiki_file": file, "source": ii["url"], "width": ii["width"], "height": ii["height"]}
        # the banner changed for a folder when its name or start date differ there, or its webp is missing
        stale = [f for f in folders
                 if (old[f].get(slug, {}).get("banner"), old[f].get(slug, {}).get("global_start"))
                 != (entry["banner"], entry["global_start"]) or not (f / f"{slug}.webp").exists()]
        print(f"  {sheet_name:22} {title}  (Global {c['start']:%Y-%m-%d})  {ii['width']}x{ii['height']}"
              f"  {'NEW' if stale else 'unchanged'}")
        if not stale:
            continue
        changed.append(sheet_name)
        if dry:
            continue
        req = urllib.request.Request(ii["url"], headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        time.sleep(1)
        from PIL import Image  # pip install pillow
        im = Image.open(io.BytesIO(data)).convert("RGB")
        im = im.resize((640, round(640 * im.height / im.width)), Image.LANCZOS)
        small = io.BytesIO(); im.save(small, "WEBP", quality=82, method=6)
        for folder in stale:
            folder.mkdir(parents=True, exist_ok=True)
            (folder / f"{slug}.webp").write_bytes(small.getvalue())
            if folder == LOCAL:
                (folder / f"{slug}.png").write_bytes(data)  # the original, for the local copy only
            manifest[folder][slug] = entry
    if not dry:
        for folder in folders:
            if manifest[folder] != old[folder]:
                ordered = {slug: manifest[folder][slug] for slug, _, _ in TYPES if slug in manifest[folder]}
                folder.mkdir(parents=True, exist_ok=True)
                (folder / "banners.json").write_text(json.dumps(ordered, ensure_ascii=False, indent=2),
                                                     encoding="utf-8")
    print(f"{len(changed)} changed: {', '.join(changed) or 'none'}" + (" (dry run, nothing written)" if dry else ""))
    if missing:
        print("not found:", ", ".join(missing))

if __name__ == "__main__":
    main()
