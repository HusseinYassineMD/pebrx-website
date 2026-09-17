#!/usr/bin/env python3
"""Build bright teal/blue logo variants with no pink or purple tones."""

from __future__ import annotations

import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images"

# PebRx brand palette
BLUE = (0, 119, 182)
TEAL = (42, 157, 143)
CYAN = (78, 205, 196)
SKY = (130, 230, 240)


def remove_white(im: Image.Image, tolerance: int = 28) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= 255 - tolerance and g >= 255 - tolerance and b >= 255 - tolerance:
                px[x, y] = (0, 0, 0, 0)
    return im


def _lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def _target_color(h_deg: float, v: float, bright: float) -> tuple[int, int, int]:
    """Map hue to bright blue/teal/cyan only."""
    t = max(0.0, min(1.0, v))
    boost = bright

    if h_deg < 200:
        base = BLUE
        accent = TEAL
    elif h_deg < 260:
        base = TEAL
        accent = CYAN
    else:
        # purple / magenta / pink → teal/cyan
        base = TEAL
        accent = CYAN

    r = _lerp(base[0], accent[0], t)
    g = _lerp(base[1], accent[1], t)
    b = _lerp(base[2], accent[2], t)

    r = min(255, int(r * boost + 18 * boost))
    g = min(255, int(g * boost + 22 * boost))
    b = min(255, int(b * boost + 26 * boost))
    return r, g, b


def recolor_logo(im: Image.Image, bright: float = 1.0) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 12:
                continue
            if r > 240 and g > 240 and b > 240:
                px[x, y] = (0, 0, 0, 0)
                continue

            h_deg = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[0] * 360
            v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[2]

            # neutral anti-aliasing fringe — tint toward nearest brand color
            if max(r, g, b) - min(r, g, b) < 18:
                nr, ng, nb = _target_color(210, 0.55, bright * 0.95)
                px[x, y] = (nr, ng, nb, a)
                continue

            nr, ng, nb = _target_color(h_deg, v, bright)
            px[x, y] = (nr, ng, nb, a)

    return im


def save_pair(name: str) -> None:
    src = OUT / f"{name}.png"
    if not src.exists():
        raise FileNotFoundError(src)

    base = remove_white(Image.open(src))
    light = recolor_logo(base.copy(), bright=1.08)
    dark = recolor_logo(base.copy(), bright=1.38)

    light.save(OUT / f"{name}-light.png", optimize=True)
    dark.save(OUT / f"{name}-dark.png", optimize=True)
    print(f"wrote {name}-light.png, {name}-dark.png")


def main() -> None:
    save_pair("logo-icon")
    save_pair("logo-text")
    print("done")


if __name__ == "__main__":
    main()
