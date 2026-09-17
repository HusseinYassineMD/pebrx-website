#!/usr/bin/env python3
"""Build transparent light/dark logo variants from source PNGs."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images"


def remove_white(im: Image.Image, tolerance: int = 28) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= 255 - tolerance and g >= 255 - tolerance and b >= 255 - tolerance:
                px[x, y] = (r, g, b, 0)
    return im


def lighten_for_dark_bg(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 12:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum < 70:
                r = min(255, int(r * 1.6 + 110))
                g = min(255, int(g * 1.55 + 108))
                b = min(255, int(b * 1.65 + 118))
            elif lum < 150:
                r = min(255, r + 36)
                g = min(255, g + 34)
                b = min(255, b + 38)
            else:
                r = min(255, r + 18)
                g = min(255, g + 18)
                b = min(255, b + 20)
            px[x, y] = (r, g, b, a)
    return im


def save_pair(name: str) -> None:
    src = OUT / f"{name}.png"
    if not src.exists():
        raise FileNotFoundError(src)
    light = remove_white(Image.open(src))
    dark = lighten_for_dark_bg(light.copy())
    light.save(OUT / f"{name}-light.png", optimize=True)
    dark.save(OUT / f"{name}-dark.png", optimize=True)
    print(f"wrote {name}-light.png, {name}-dark.png")


def main() -> None:
    save_pair("logo-icon")
    save_pair("logo-text")
    print("done")


if __name__ == "__main__":
    main()
