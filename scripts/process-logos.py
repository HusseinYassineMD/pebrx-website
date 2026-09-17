#!/usr/bin/env python3
"""Build logo variants: original colors on light bg, mission teal on dark bg."""

from __future__ import annotations

import colorsys
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
                px[x, y] = (0, 0, 0, 0)
    return im


def _lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


# Match site --teal / .btn-primary (Our Mission)
MISSION_TEAL = (42, 157, 143)
MISSION_TEAL_LIGHT = (78, 205, 196)


def _mission_teal(v: float) -> tuple[int, int, int]:
    """Map pixel brightness to mission teal, with a subtle lighter lift."""
    t = max(0.0, min(1.0, v))
    lift = t * 0.42
    return (
        _lerp(MISSION_TEAL[0], MISSION_TEAL_LIGHT[0], lift),
        _lerp(MISSION_TEAL[1], MISSION_TEAL_LIGHT[1], lift),
        _lerp(MISSION_TEAL[2], MISSION_TEAL_LIGHT[2], lift),
    )


def recolor_for_dark_bg(im: Image.Image) -> Image.Image:
    """Mission teal wordmark for dark backgrounds — matches Our Mission button."""
    im = im.convert("RGBA")
    px = im.load()

    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a < 12:
                continue
            if r > 240 and g > 240 and b > 240:
                px[x, y] = (0, 0, 0, 0)
                continue

            v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[2]
            nr, ng, nb = _mission_teal(v)
            px[x, y] = (nr, ng, nb, a)

    return im


def save_pair(name: str) -> None:
    src = OUT / f"{name}.png"
    if not src.exists():
        raise FileNotFoundError(src)

    base = remove_white(Image.open(src))
    light = base.copy()
    dark = recolor_for_dark_bg(base.copy())

    light.save(OUT / f"{name}-light.png", optimize=True)
    dark.save(OUT / f"{name}-dark.png", optimize=True)
    print(f"wrote {name}-light.png (original), {name}-dark.png (mission teal)")


def main() -> None:
    save_pair("logo-icon")
    save_pair("logo-text")
    print("done")


if __name__ == "__main__":
    main()
