#!/usr/bin/env python3
"""Generate deterministic high-resolution paper textures for Remotion scenes."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


SIZE = 1024
RESAMPLING = getattr(Image, "Resampling", Image)


PRESETS = {
    "cotton": {"base": (239, 229, 207), "fiber": (126, 103, 70), "seed": 8101},
    "ivory": {"base": (247, 241, 222), "fiber": (139, 119, 86), "seed": 8102},
    "kraft": {"base": (203, 167, 116), "fiber": (91, 65, 38), "seed": 8103},
    "notebook": {"base": (244, 239, 220), "fiber": (122, 112, 91), "seed": 8104},
    "graph": {"base": (235, 241, 224), "fiber": (111, 122, 91), "seed": 8105},
}


def scaled_noise(rng: np.random.Generator, cells: int, blur: float = 0.0) -> np.ndarray:
    source = rng.normal(0, 1, (cells, cells)).astype(np.float32)
    source -= source.min()
    source /= max(1e-6, source.max())
    image = Image.fromarray(np.uint8(source * 255), mode="L").resize((SIZE, SIZE), RESAMPLING.BICUBIC)
    if blur:
        image = image.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(image, dtype=np.float32) / 255.0 - 0.5


def make_texture(name: str, config: dict) -> Image.Image:
    seed = int(config["seed"])
    py_rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)
    base = np.zeros((SIZE, SIZE, 3), dtype=np.float32)
    base[:] = config["base"]

    broad = scaled_noise(np_rng, 10, 1.4)
    medium = scaled_noise(np_rng, 48, 0.7)
    fine = scaled_noise(np_rng, 180, 0.25)
    variation = broad * 14 + medium * 7 + fine * 3
    base += variation[:, :, None]
    base = np.clip(base, 0, 255).astype(np.uint8)
    image = Image.fromarray(base, mode="RGB").convert("RGBA")

    fibers = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(fibers)
    fiber_color = config["fiber"]
    for _ in range(1900):
        x = py_rng.randrange(-30, SIZE)
        y = py_rng.randrange(0, SIZE)
        length = py_rng.randint(5, 38)
        rise = py_rng.randint(-3, 3)
        alpha = py_rng.randint(8, 27)
        width = 1 if py_rng.random() < 0.88 else 2
        draw.line((x, y, x + length, y + rise), fill=(*fiber_color, alpha), width=width)

    for _ in range(420):
        x = py_rng.randrange(SIZE)
        y = py_rng.randrange(SIZE)
        radius = py_rng.choice((1, 1, 1, 2, 3))
        alpha = py_rng.randint(10, 34)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*fiber_color, alpha))
    image = Image.alpha_composite(image, fibers)

    wrinkles = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    wrinkle_draw = ImageDraw.Draw(wrinkles)
    for index in range(8):
        y = py_rng.randint(80, SIZE - 80)
        points = [(-80, y)]
        for step in range(1, 7):
            points.append((step * 190 - 80, y + py_rng.randint(-55, 55)))
        shade = (94, 72, 43, 15 + index % 3 * 3)
        light = (255, 252, 232, 28)
        wrinkle_draw.line(points, fill=shade, width=3)
        wrinkle_draw.line([(x, yy - 3) for x, yy in points], fill=light, width=2)
    wrinkles = wrinkles.filter(ImageFilter.GaussianBlur(2.2))
    image = Image.alpha_composite(image, wrinkles)

    ruling = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ruling_draw = ImageDraw.Draw(ruling)
    if name == "notebook":
        for y in range(74, SIZE, 58):
            ruling_draw.line((0, y, SIZE, y), fill=(88, 143, 177, 54), width=2)
        ruling_draw.line((116, 0, 116, SIZE), fill=(196, 88, 83, 72), width=3)
        ruling_draw.line((124, 0, 124, SIZE), fill=(196, 88, 83, 30), width=1)
    if name == "graph":
        for offset in range(0, SIZE, 48):
            alpha = 47 if offset % 192 else 72
            ruling_draw.line((offset, 0, offset, SIZE), fill=(65, 123, 118, alpha), width=1 if alpha == 47 else 2)
            ruling_draw.line((0, offset, SIZE, offset), fill=(65, 123, 118, alpha), width=1 if alpha == 47 else 2)
    image = Image.alpha_composite(image, ruling)
    return image.convert("RGB")


if __name__ == '__main__':
    dest=Path(__file__).resolve().parents[1]/'public/textures/codex-paper.png'
    dest.parent.mkdir(parents=True,exist_ok=True)
    make_texture('cotton', PRESETS['cotton']).save(dest)
