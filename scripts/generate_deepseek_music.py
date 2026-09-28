#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
DeepSeek 小鲸导演 · 工作台复刻：自制 120 BPM 配乐 + 操作音效。

从零用 numpy 合成，不读取、不复用任何旧音频脚本或旧成片声轨。
输出：
  public/ds-imageref/music.wav   —— 完整混音（配乐 + 音效），44.1kHz 立体声
  audio/cues.json                —— 音效落点表，供 Remotion 时间轴共用同一组数字
"""

import json
import math
import os
import struct
import wave

import numpy as np

SR = 44100
BPM = 120.0
BEAT = 60.0 / BPM          # 0.5 s
BAR = BEAT * 4             # 2.0 s
DURATION = 30.6
TAIL = 0.45
TOTAL = DURATION + TAIL
N = int(TOTAL * SR)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PUBLIC = os.path.join(ROOT, "public", "audio")

rng = np.random.default_rng(20260927)


# --------------------------------------------------------------------------
# 基础工具
# --------------------------------------------------------------------------
def t_axis():
    return np.arange(N) / SR


def env_exp(n, attack, decay):
    """attack(线性) + 指数衰减包络，长度 n 采样。"""
    a = max(1, int(attack * SR))
    e = np.empty(n, dtype=np.float64)
    a = min(a, n)
    e[:a] = np.linspace(0.0, 1.0, a)
    if n > a:
        rest = n - a
        e[a:] = np.exp(-np.arange(rest) / (decay * SR))
    return e


def add(buf, start, sig, gain=1.0):
    i = int(round(start * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def one_pole_lp(x, cutoff):
    """一阶低通，cutoff 可为数组（随时间变化）。"""
    a = np.exp(-2.0 * np.pi * np.asarray(cutoff, dtype=np.float64) / SR)
    y = np.empty_like(x)
    prev = 0.0
    for i in range(len(x)):
        prev = (1.0 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y


def vec_lp(x, cutoff_track):
    """向量化的时变一阶低通（用累计乘积近似，够用且快）。"""
    c = np.asarray(cutoff_track, dtype=np.float64)
    a = np.exp(-2.0 * np.pi * c / SR)
    # y[i] = (1-a)x[i] + a*y[i-1]  ->  直接递归太慢，用分段常数近似
    seg = 512
    y = np.empty_like(x)
    prev = 0.0
    for s in range(0, len(x), seg):
        e = min(len(x), s + seg)
        aa = float(np.mean(a[s:e]))
        blk = x[s:e]
        out = np.empty_like(blk)
        for i in range(len(blk)):
            prev = (1.0 - aa) * blk[i] + aa * prev
            out[i] = prev
        y[s:e] = out
    return y


def hp(x, cutoff):
    return x - one_pole_lp(x, np.full(len(x), cutoff))


def saw(freq, n, phase=0.0):
    t = np.arange(n) / SR
    return 2.0 * ((freq * t + phase) % 1.0) - 1.0


def sine(freq, n, phase=0.0):
    t = np.arange(n) / SR
    return np.sin(2.0 * np.pi * freq * t + phase)


def tri(freq, n):
    t = np.arange(n) / SR
    p = (freq * t) % 1.0
    return 4.0 * np.abs(p - 0.5) - 1.0


def noise(n):
    return rng.standard_normal(n)


def note(name):
    """音名 -> 频率，如 'A2' 'C#4'。"""
    base = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
            "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    if len(name) == 3:
        p, octv = name[:2], int(name[2])
    else:
        p, octv = name[:1], int(name[1:])
    midi = 12 * (octv + 1) + base[p]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


# --------------------------------------------------------------------------
# 鼓组
# --------------------------------------------------------------------------
def kick(dur=0.40):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 118.0 * np.exp(-t / 0.035) + 46.0
    body = np.sin(2.0 * np.pi * np.cumsum(f) / SR)
    e = env_exp(n, 0.001, 0.115)
    click = noise(n) * np.exp(-t / 0.004) * 0.25
    return (body * e + click) * 0.95


def snare(dur=0.26):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = hp(noise(n), 900.0) * env_exp(n, 0.001, 0.075)
    tone = (sine(196.0, n) + sine(294.0, n) * 0.6) * env_exp(n, 0.001, 0.045)
    return nz * 0.55 + tone * 0.35


def hat(dur=0.055, open_=False):
    n = int(dur * SR)
    if open_:
        n = int(0.22 * SR)
    nz = hp(noise(n), 6500.0)
    return nz * env_exp(n, 0.0008, 0.10 if open_ else 0.022) * 0.30


def shaker(dur=0.08):
    n = int(dur * SR)
    return hp(noise(n), 4200.0) * env_exp(n, 0.006, 0.030) * 0.18


def clap(dur=0.22):
    n = int(dur * SR)
    out = np.zeros(n)
    for k, off in enumerate([0.0, 0.008, 0.017, 0.027]):
        seg = hp(noise(n), 1100.0) * env_exp(n, 0.001, 0.055)
        add(out, off, seg, 0.32)
    return out * 0.9


# --------------------------------------------------------------------------
# 旋律乐器
# --------------------------------------------------------------------------
def bass_note(f, dur):
    n = int(dur * SR)
    s = saw(f, n) * 0.55 + sine(f, n) * 0.45 + saw(f * 2, n) * 0.14
    s = one_pole_lp(s, np.full(n, 520.0))
    return s * env_exp(n, 0.006, dur * 0.42)


def pad_chord(freqs, dur, detune=0.006):
    n = int(dur * SR)
    out = np.zeros(n)
    for f in freqs:
        for d in (-detune, 0.0, detune):
            out += saw(f * (1.0 + d), n) * 0.16
            out += tri(f * (1.0 + d) * 0.5, n) * 0.10
    a = int(0.28 * SR)
    e = np.ones(n)
    e[:a] = np.linspace(0.0, 1.0, a) ** 1.6
    e[a:] = np.exp(-np.arange(n - a) / (dur * 0.85 * SR))
    return out * e / max(1, len(freqs))


def lead_note(f, dur):
    n = int(dur * SR)
    vib = 1.0 + 0.0035 * np.sin(2.0 * np.pi * 5.2 * np.arange(n) / SR)
    t = np.arange(n) / SR
    s = np.sin(2.0 * np.pi * f * vib * t) * 0.7 + np.sin(4.0 * np.pi * f * vib * t) * 0.18
    return s * env_exp(n, 0.010, dur * 0.38)


def pluck(f, dur):
    n = int(dur * SR)
    s = tri(f, n) * 0.6 + sine(f * 2.0, n) * 0.2
    s = one_pole_lp(s, np.full(n, 2600.0))
    return s * env_exp(n, 0.002, dur * 0.30)


# --------------------------------------------------------------------------
# 音效
# --------------------------------------------------------------------------
def sfx_whoosh(dur=0.30, up=True):
    n = int(dur * SR)
    nz = noise(n)
    f0, f1 = (600.0, 3800.0) if up else (3800.0, 600.0)
    c = np.linspace(f0, f1, n)
    s = vec_lp(nz, c)
    return hp(s, 260.0) * env_exp(n, 0.03, dur * 0.28) * 0.55


def sfx_click(dur=0.09):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sine(1750.0, n) * np.exp(-t / 0.006) + sine(980.0, n) * np.exp(-t / 0.011) * 0.6
    s += hp(noise(n), 3000.0) * np.exp(-t / 0.003) * 0.35
    return s * 0.45


def sfx_key(dur=0.13):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (sine(2200.0, n) * 0.4 + sine(3300.0, n) * 0.2 + hp(noise(n), 5000.0) * 0.5)
    return s * np.exp(-t / 0.016) * 0.42


def sfx_thud(dur=0.24):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 150.0 * np.exp(-t / 0.05) + 62.0
    body = np.sin(2.0 * np.pi * np.cumsum(f) / SR)
    return (body * env_exp(n, 0.002, 0.075) + hp(noise(n), 2200.0) * np.exp(-t / 0.008) * 0.3) * 0.7


def sfx_trash(dur=0.42):
    n = int(dur * SR)
    t = np.arange(n) / SR
    metal = np.zeros(n)
    for f in (820.0, 1240.0, 1970.0, 2630.0):
        metal += np.sin(2.0 * np.pi * f * t) * np.exp(-t / (0.06 + f / 40000.0))
    crumple = hp(noise(n), 2600.0) * env_exp(n, 0.004, 0.09)
    return (metal * 0.22 + crumple * 0.5) * 0.8


def sfx_slide(dur=0.5, up=True):
    n = int(dur * SR)
    f = np.linspace(320.0, 880.0, n) if up else np.linspace(880.0, 320.0, n)
    t = np.arange(n) / SR
    s = np.sin(2.0 * np.pi * np.cumsum(f) / SR)
    s += hp(noise(n), 3600.0) * 0.16
    return s * env_exp(n, 0.02, dur * 0.4) * 0.26


def sfx_ding(freq=1320.0, dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2.0 * np.pi * freq * t) * 0.6 + np.sin(2.0 * np.pi * freq * 2.01 * t) * 0.25
    return s * np.exp(-t / 0.16) * 0.4


def sfx_error(dur=0.42):
    n = int(dur * SR)
    out = np.zeros(n)
    add(out, 0.00, sfx_ding(760.0, 0.22), 0.9)
    add(out, 0.13, sfx_ding(560.0, 0.30), 0.9)
    return out * 0.55


def sfx_reverse(dur=0.34):
    s = sfx_whoosh(dur, up=True)
    return s[::-1] * 0.6


def sfx_glitch(dur=0.45):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(14):
        off = rng.uniform(0.0, dur - 0.05)
        seg_n = int(rng.uniform(0.012, 0.045) * SR)
        f = rng.uniform(180.0, 3400.0)
        seg = np.sign(np.sin(2.0 * np.pi * f * np.arange(seg_n) / SR)) * 0.5
        seg *= env_exp(seg_n, 0.001, 0.012)
        add(out, off, seg, 1.0)
    out += hp(noise(n), 2400.0) * env_exp(n, 0.004, 0.06) * 0.35
    return out * 0.5


def sfx_pop(dur=0.34):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(420.0, 1500.0, n)
    s = np.sin(2.0 * np.pi * np.cumsum(f) / SR)
    return (s * np.exp(-t / 0.03) + hp(noise(n), 3000.0) * np.exp(-t / 0.012) * 0.6) * 0.5


def sfx_confetti(dur=0.9):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(26):
        off = rng.uniform(0.0, 0.55)
        f = rng.uniform(900.0, 3200.0)
        seg_n = int(0.10 * SR)
        seg = np.sin(2.0 * np.pi * f * np.arange(seg_n) / SR)
        seg *= np.exp(-np.arange(seg_n) / (0.02 * SR))
        add(out, off, seg, 0.10)
    out += hp(noise(n), 3000.0) * env_exp(n, 0.005, 0.10) * 0.25
    return out * 0.7


def sfx_boing(dur=0.55):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 260.0 * np.exp(-t / 0.16) + 130.0
    s = np.sin(2.0 * np.pi * np.cumsum(f) / SR) * 0.8
    s += tri(f * 2.0, n) * 0.2
    return s * env_exp(n, 0.004, 0.16) * 0.5


def sfx_squash(dur=0.26):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(300.0, 120.0, n)
    s = np.sin(2.0 * np.pi * np.cumsum(f) / SR)
    return s * np.exp(-t / 0.06) * 0.42


def sfx_step(dur=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return (hp(noise(n), 1400.0) * np.exp(-t / 0.012) * 0.5
            + sine(160.0, n) * np.exp(-t / 0.02) * 0.35) * 0.30


def sfx_progress(dur=0.10):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return (sine(1880.0, n) * 0.5 + hp(noise(n), 4200.0) * 0.4) * np.exp(-t / 0.010) * 0.22


def sfx_chime(dur=1.1):
    out = np.zeros(int(dur * SR))
    for i, f in enumerate((784.0, 988.0, 1319.0, 1568.0)):
        add(out, i * 0.085, sfx_ding(f, dur - i * 0.085), 0.55)
    return out * 0.8


def sfx_sparkle(dur=0.7):
    out = np.zeros(int(dur * SR))
    for i, f in enumerate((1568.0, 2093.0, 2637.0)):
        add(out, i * 0.05, sfx_ding(f, 0.45), 0.30)
    return out


def sfx_beep(freq=1050.0, dur=0.14):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sign(np.sin(2.0 * np.pi * freq * t))
    e = np.ones(n)
    e[: int(0.005 * SR)] = np.linspace(0, 1, int(0.005 * SR))
    e[-int(0.02 * SR):] = np.linspace(1, 0, int(0.02 * SR))
    return s * e * 0.22


# --------------------------------------------------------------------------
# 配乐排布
# --------------------------------------------------------------------------
# 和声进行：Am - F - C - G，每小节一个和弦（一小节 2.0s）
PROG = [
    ("Am", ["A2"], ["A3", "C4", "E4"]),
    ("F",  ["F2"], ["F3", "A3", "C4"]),
    ("C",  ["C3"], ["C4", "E4", "G4"]),
    ("G",  ["G2"], ["G3", "B3", "D4"]),
]

MELODY = ["A4", "C5", "E5", "D5", "C5", "A4", "G4", "A4"]
PENTA = ["A4", "C5", "D5", "E5", "G5", "E5", "D5", "C5"]

# 分层强度；下标＝小节号，一小节 2.0s
#   bar :  0  1 | 2  3 | 4  5 | 6  7 | 8  9 |10 11 |12 13 |14 15
#   时间: 0-4s   | 4-8s  | 8-12s |12-16s|16-20s|20-24s|24-28s|28-32s
LAYERS = {
    "kick":   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    "snare":  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    "hat":    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    "bass":   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    "pad":    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    "lead":   [0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    "perc":   [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    "clap":   [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
}

n_bars = int(math.ceil(TOTAL / BAR)) + 1


def bar_layer(name, bar):
    arr = LAYERS[name]
    return arr[bar] if bar < len(arr) else 0


def build_music():
    music = np.zeros(N)
    pad_bus = np.zeros(N)

    for bar in range(n_bars):
        t0 = bar * BAR
        if t0 > TOTAL:
            break
        chord = PROG[bar % 4]
        root, notes = chord[1], chord[2]

        # --- 和弦垫
        if bar_layer("pad", bar):
            pad_bus_add = pad_chord([note(x) for x in notes], BAR * 1.02)
            add(pad_bus, t0, pad_bus_add, 0.26)

        # --- 贝斯：每拍一下，1/3 拍走八度
        if bar_layer("bass", bar):
            for b in range(4):
                f = note(root[0])
                if b == 3 and bar % 4 == 3:
                    f *= 1.5
                add(music, t0 + b * BEAT, bass_note(f, BEAT * 1.05), 0.24)

        # --- 鼓
        if bar_layer("kick", bar):
            pat = [0, 2] if bar < 2 else ([0, 1.5, 2, 3] if bar % 4 == 3 else [0, 2])
            for b in pat:
                add(music, t0 + b * BEAT, kick(), 0.50)
        if bar_layer("snare", bar):
            for b in (1, 3):
                add(music, t0 + b * BEAT, snare(), 0.50)
        if bar_layer("clap", bar) and bar % 4 == 3:
            add(music, t0 + 3 * BEAT, clap(), 0.34)
        if bar_layer("hat", bar):
            for b in range(8):
                h = hat(open_=(b == 7 and bar % 2 == 1))
                add(music, t0 + b * BEAT * 0.5, h, 1.25 if b % 2 == 0 else 0.85)
        if bar_layer("perc", bar):
            for b in range(4):
                add(music, t0 + (b + 0.5) * BEAT, shaker(), 1.15)

        # --- 旋律
        if bar_layer("lead", bar):
            step = 2 if bar % 2 == 0 else 2
            for k in range(2):
                idx = (bar * 2 + k) % len(MELODY if bar < 8 else PENTA)
                src = MELODY if bar < 8 else PENTA
                nm = src[idx % len(src)]
                off = [0.0, 1.0, 2.5, 3.0][(bar + k) % 4]
                add(music, t0 + off * BEAT, lead_note(note(nm), BEAT * 1.2), 0.30)
            if bar % 4 == 3:
                for k, nm in enumerate(["E5", "D5", "C5", "A4"]):
                    add(music, t0 + 2 * BEAT + k * BEAT * 0.5,
                        pluck(note(nm), BEAT * 0.5), 0.20)

    # --- 14.5–16.0s 的滤波打开（"调出一点气氛"）
    c = np.full(N, 5200.0)
    t = t_axis()
    ramp = (t >= 14.3) & (t <= 16.2)
    c[ramp] = 420.0 + (5200.0 - 420.0) * ((t[ramp] - 14.3) / 1.9) ** 1.4
    c[t < 14.3] = 5200.0
    pad_bus = vec_lp(pad_bus, c)

    # --- 20–23s 卡点段：pad 加切分颤音
    dance = np.zeros(N)
    for k in range(int(3.0 / (BEAT * 0.5))):
        tt = 20.0 + k * BEAT * 0.5
        if tt > 23.2:
            break
        add(dance, tt, pluck(note(PENTA[k % len(PENTA)]), 0.16), 0.16)
    dance = vec_lp(dance, np.full(N, 3000.0))

    music += pad_bus + dance

    # --- 26.5s 大落点
    add(music, 26.48, kick(), 0.62)
    add(music, 26.48, sfx_confetti(0.8), 0.35)
    add(music, 26.55, pad_chord([note(x) for x in ["A3", "C4", "E4", "A4"]], 3.6), 0.24)

    # --- 结尾自然收束：29.4s 起柔和淡出，30.7s 归零（成片 30.6s 收声）
    fade = np.ones(N)
    fs = int(29.40 * SR)
    fe = min(N, int(30.72 * SR))
    span = fe - fs
    fade[fs:fe] = (0.5 + 0.5 * np.cos(np.linspace(0.0, np.pi, span))) ** 1.25
    fade[fe:] = 0.0
    music *= fade

    return music, pad_bus


# --------------------------------------------------------------------------
# 音效落点（与 remotion/src/timeline.ts 共用；同时导出 cues.json）
# --------------------------------------------------------------------------
CUES = []


def cue(t, name, gain=1.0):
    CUES.append({"t": round(t, 4), "name": name, "gain": gain})


def build_sfx():
    s = np.zeros(N)

    def put(t, sig, g=1.0):
        add(s, t, sig, g)

    # ---- 0–4s 导入
    cue(0.00, "music_start")
    put(0.00, sfx_slide(0.6, up=True), 0.5)
    cue(0.28, "char_enter")
    put(0.28, sfx_whoosh(0.34), 0.8)
    for i, (grab, drop) in enumerate([(0.95, 1.35), (1.75, 2.15), (2.55, 2.95), (3.35, 3.75)]):
        cue(grab, "grab_%d" % (i + 1))
        put(grab, sfx_whoosh(0.22, up=True), 0.55)
        put(grab + 0.06, sfx_step(), 0.7)
        cue(drop, "drop_%d" % (i + 1))
        put(drop, sfx_thud(), 0.75)
        put(drop + 0.02, sfx_bounce_land(), 0.5) if False else None
        put(drop + 0.03, sfx_beep(880.0 + i * 110.0, 0.12), 0.5)
    cue(3.95, "section_intro_end")
    put(3.95, sfx_ding(1046.0, 0.4), 0.35)

    # ---- 4–7s 删除
    cue(4.15, "walk")
    put(4.15, sfx_step(), 0.6)
    put(4.35, sfx_step(), 0.5)
    cue(4.55, "select_segment")
    put(4.55, sfx_click(), 0.9)
    put(5.05, sfx_thud(), 0.5)
    cue(5.45, "grab_segment")
    put(5.45, sfx_whoosh(0.26, up=True), 0.6)
    cue(6.15, "at_trash")
    put(6.15, sfx_slide(0.28, up=False), 0.35)
    cue(6.35, "drop_trash")
    put(6.35, sfx_trash(), 0.9)
    cue(6.50, "track_close")
    for k in range(3):
        put(6.50 + k * 0.11, sfx_click(), 0.55)
        put(6.50 + k * 0.11, sfx_slide(0.12, up=True), 0.28)
    cue(6.80, "after_delete")
    put(6.80, sfx_ding(1174.0, 0.45), 0.4)
    cue(6.95, "satisfied")

    # ---- 7–10.5s 转场
    cue(7.15, "walk_to_effect")
    put(7.15, sfx_step(), 0.55)
    put(7.35, sfx_step(), 0.5)
    cue(7.55, "open_effect_tab")
    put(7.55, sfx_click(), 0.85)
    cue(8.05, "try_flip")
    put(8.05, sfx_click(), 0.9)
    put(8.10, sfx_whoosh(0.42, up=True), 0.7)
    cue(8.60, "flip_done")
    put(8.60, sfx_pop(), 0.5)
    cue(9.00, "try_glitch")
    put(9.00, sfx_click(), 0.9)
    cue(9.18, "glitch_on")
    put(9.18, sfx_glitch(0.5), 0.75)
    cue(9.50, "too_strong")
    put(9.50, sfx_error(0.5), 0.7)
    cue(9.90, "surprise")
    put(9.90, sfx_beep(1500.0, 0.10), 0.5)
    put(9.98, sfx_beep(1180.0, 0.12), 0.5)

    # ---- 10.5–14.5s 标题 / 撤销
    cue(10.70, "open_text_tab")
    put(10.70, sfx_click(), 0.85)
    cue(11.00, "add_title")
    put(11.00, sfx_click(), 0.9)
    cue(11.40, "title_land")
    put(11.40, sfx_thud(), 0.7)
    put(11.44, sfx_sparkle(0.6), 0.35)
    cue(11.95, "thinking")
    put(11.95, sfx_beep(620.0, 0.10), 0.35)
    put(12.12, sfx_beep(700.0, 0.10), 0.35)
    cue(12.45, "decide_undo")
    put(12.45, sfx_beep(880.0, 0.10), 0.4)
    cue(12.90, "undo_press")
    put(12.90, sfx_key(), 0.95)
    cue(13.05, "title_removed")
    put(13.05, sfx_reverse(0.34), 0.7)
    put(13.10, sfx_pop(), 0.45)
    cue(13.50, "relieved")
    put(13.50, sfx_slide(0.4, up=True), 0.3)
    cue(13.95, "satisfied_blink")
    put(13.95, sfx_ding(1318.0, 0.4), 0.32)

    # ---- 14.5–20s 滤镜
    cue(14.70, "reach_saturation")
    put(14.70, sfx_whoosh(0.30, up=True), 0.55)
    cue(15.02, "touch_knob")
    put(15.02, sfx_click(), 0.7)
    put(15.05, sfx_slide(1.3, up=True), 0.30)
    cue(16.40, "overshoot")
    put(16.40, sfx_beep(1980.0, 0.10), 0.5)
    cue(16.62, "surprise_sat")
    put(16.62, sfx_error(0.55), 0.75)
    put(16.86, sfx_beep(1420.0, 0.12), 0.45)
    cue(17.00, "pull_back")
    put(17.00, sfx_slide(1.35, up=False), 0.30)
    cue(18.45, "release_knob")
    put(18.45, sfx_click(), 0.7)
    cue(18.62, "satisfied_after_filter")
    put(18.62, sfx_ding(1174.0, 0.5), 0.4)
    put(18.74, sfx_sparkle(0.5), 0.25)

    # ---- 20–23s 卡点
    cue(20.15, "reach_autobeat")
    put(20.15, sfx_whoosh(0.26, up=True), 0.5)
    cue(20.35, "click_autobeat")
    put(20.35, sfx_click(), 0.95)
    for k in range(8):
        tt = 20.55 + k * BEAT
        cue(round(tt, 3), "beatmark_%d" % (k + 1))
        put(tt, sfx_beep(1245.0 + (k % 4) * 110.0, 0.11), 0.42)
    cue(21.05, "dance_start")

    # ---- 23–26.5s 导出
    cue(23.15, "reach_export")
    put(23.15, sfx_whoosh(0.26, up=True), 0.5)
    cue(23.32, "click_export")
    put(23.32, sfx_click(), 0.95)
    for k in range(9):
        tt = 23.45 + k * 0.2
        cue(round(tt, 3), "progress_%d" % (k + 1))
        put(tt, sfx_progress(), 0.8)
    cue(25.45, "render_done")
    put(25.45, sfx_chime(1.1), 0.55)
    cue(25.95, "wait_think")
    put(25.95, sfx_beep(660.0, 0.10), 0.3)
    cue(26.10, "pre_crouch")
    put(26.10, sfx_squash(), 0.8)
    cue(26.34, "launch")
    put(26.34, sfx_boing(), 0.85)
    cue(26.52, "apex_confetti")
    put(26.52, sfx_confetti(0.9), 0.9)
    cue(26.80, "land")
    put(26.80, sfx_thud(), 0.85)
    cue(27.05, "recover")
    put(27.05, sfx_slide(0.3, up=False), 0.3)

    # ---- 26.5–30.6s 收尾
    cue(27.20, "done_badge")
    put(27.20, sfx_sparkle(0.7), 0.4)
    cue(27.60, "made_with_card")
    put(27.60, sfx_slide(0.35, up=True), 0.35)
    cue(28.00, "final_title")
    put(28.00, sfx_ding(1568.0, 0.7), 0.35)
    cue(30.35, "tail_end")

    return s


def sfx_bounce_land():
    return sfx_thud(0.2)


# --------------------------------------------------------------------------
# 混音输出
# --------------------------------------------------------------------------
def main():
    os.makedirs(PUBLIC, exist_ok=True)
    os.makedirs(HERE, exist_ok=True)

    music, _ = build_music()
    sfx = build_sfx()

    music = hp(music, 34.0)
    music = np.tanh(music * 1.30) * 0.76
    sfx = np.tanh(sfx * 1.0) * 0.62

    mix = music + sfx
    # 轻总线限幅
    peak = np.max(np.abs(mix))
    if peak > 0:
        mix = np.tanh(mix / max(peak, 0.98) * 1.02) * 0.94

    # 轻微立体声扩散
    delay = int(0.008 * SR)
    left = mix.copy()
    right = mix.copy()
    right[delay:] = right[delay:] * 0.94 + mix[:-delay] * 0.06
    left[:-delay] = left[:-delay] * 0.94 + mix[delay:] * 0.06

    stereo = np.stack([left, right], axis=1)
    pcm = np.clip(stereo, -1.0, 1.0)
    pcm16 = (pcm * 32767.0).astype("<i2")

    path = os.path.join(PUBLIC, "deepseek.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm16.tobytes())

    with open(os.path.join(PUBLIC, "deepseek-cues.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": 30, "bpm": BPM, "duration": TOTAL, "cues": CUES},
                  f, ensure_ascii=False, indent=1)

    print("wrote %s (%.2fs, %d bytes)" % (path, len(pcm16) / SR, os.path.getsize(path)))
    print("cues: %d" % len(CUES))


if __name__ == "__main__":
    main()
