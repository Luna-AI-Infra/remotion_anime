#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""生成固定 seed 的纸纹/颗粒贴图。每帧复用同一张，不做逐帧随机。"""

import os
import numpy as np
from PIL import Image

SR = 20260927
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public", "textures")


def smooth_noise(h, w, scale, rng):
    """低频值噪声：随机 + 双线性放大。"""
    sh, sw = max(2, h // scale), max(2, w // scale)
    small = rng.random((sh, sw)).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8), mode="L")
    img = img.resize((w, h), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0


def make_paper():
    h, w = 1080, 1920
    rng = np.random.default_rng(SR)

    fine = rng.random((h, w)).astype(np.float32)
    low = smooth_noise(h, w, 48, rng)
    mid = smooth_noise(h, w, 12, rng)

    # 纸纤维：水平方向的细长起伏
    fib = smooth_noise(h // 4, w, 3, rng)
    fib = np.repeat(fib, 4, axis=0)[:h, :]
    fib = (fib - fib.mean()) * 0.5

    # 极轻的颗粒 + 纤维 + 大块不匀
    n = (fine - 0.5) * 0.013 + (mid - 0.5) * 0.026 + (low - 0.5) * 0.034 + fib * 0.014

    base = np.array([0.957, 0.925, 0.867], dtype=np.float32)  # #F4ECDD
    img = base[None, None, :] + n[:, :, None]
    # 四角略深，中间略亮
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    vig = 1.0 - 0.018 * (((xx / w - 0.5) ** 2 + (yy / h - 0.5) ** 2) ** 0.5) * 2.0
    img = img * vig[:, :, None]

    px = np.clip(img * 255.0, 0, 255).astype(np.uint8)
    Image.fromarray(px, mode="RGB").save(os.path.join(OUT, "deepseek-paper.png"), optimize=True)
    print("deepseek-paper.png", px.shape)

    # 颗粒感贴图：手机预览里的"颗粒感"参数用（中性灰，叠加用）
    g = rng.random((540, 960)).astype(np.float32)
    Image.fromarray((g * 255).astype(np.uint8), mode="L").save(
        os.path.join(OUT, "grain.png"), optimize=True)
    print("grain.png")

    # 纸屑粒子用的四色小圆点（透明 PNG）
    chips = Image.new("RGBA", (256, 64), (0, 0, 0, 0))
    cols = [(235, 215, 155), (240, 200, 208), (205, 195, 228), (156, 198, 166)]
    for i, c in enumerate(cols):
        tile = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        a = np.zeros((64, 64), dtype=np.uint8)
        yy2, xx2 = np.mgrid[0:64, 0:64]
        a[((xx2 - 32) ** 2 + (yy2 - 32) ** 2) < 30 ** 2] = 255
        tile.putdata([(c[0], c[1], c[2], int(v)) for v in a.reshape(-1)])
        chips.paste(tile, (i * 64, 0), tile)
    chips.save(os.path.join(OUT, "chips.png"), optimize=True)
    print("chips.png")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_paper()
