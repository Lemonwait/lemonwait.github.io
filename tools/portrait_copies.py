"""Smaller WebP copies of every portrait in operator/avatars, for pages that show portraits small.

The browser shrinks a picture roughly: a 180 px portrait drawn in an 84 px box gets jagged edges. Pages pick the
copy nearest above their box instead (srcset), so the browser shrinks by less than 2x:
  operator/avatars/w96/<name>.webp   "normal" copy, 96 px wide
  operator/avatars/w48/<name>.webp   "small" copy, 48 px wide
The original PNG stays for boxes over 96 px and for sharp (2x) screens.

Makes only the copies that are missing or older than their PNG. Run from the site folder:
  python tools/portrait_copies.py            (every portrait)
  python tools/portrait_copies.py a.png ...  (only these)
The Monday sync (.github/workflows/sync-avatars.yml) runs it after downloading new portraits."""
import os, sys, glob
from PIL import Image

SRC = 'operator/avatars'
WIDTHS = (96, 48)

def copy(png):
    stem = os.path.splitext(os.path.basename(png))[0]
    made = 0
    im = None
    for w in WIDTHS:
        out = f'{SRC}/w{w}/{stem}.webp'
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(png):
            continue
        if im is None:
            im = Image.open(png).convert('RGBA')   # palette PNGs too: resize in full colour, never nearest-neighbour
        h = max(1, round(im.height * w / im.width))
        small = im.resize((w, h), Image.LANCZOS) if im.width > w else im
        os.makedirs(os.path.dirname(out), exist_ok=True)
        small.save(out, 'WEBP', quality=90, method=4)
        made += 1
    return made

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob(f'{SRC}/*.png'))
    n = sum(copy(f) for f in files)
    print(f'{len(files)} portraits checked, {n} copies made')
