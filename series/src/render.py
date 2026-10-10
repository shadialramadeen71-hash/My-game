"""Render the FOURTH QUARTER episodes as 1080x1920 vertical shorts.

usage: python3 render.py BUILD_DIR FONT_DIR MUSIC_DIR OUT_DIR [episode numbers...]
"""
import json, math, os, random, re, subprocess, sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from scipy.signal import butter, sosfilt

import art
import rig
from art import W, H, NAVY, GOLD, WOLF, WHITE, font, project
from script import EPISODES, SERIES, CAST

FPS = 30
SR = 48000
BUILD, FONT_DIR, MUSIC_DIR, OUT = sys.argv[1:5]
art.FONT_DIR = FONT_DIR

INTRO, OUTRO = 2.8, 3.6
SPEAKER_STYLE = {
    "MARCUS": ("MARCUS REED  #7", GOLD, (20, 20, 20)),
    "COACH": ("COACH RAY DAWSON", (110, 180, 255), (10, 20, 40)),
    "ANNOUNCER": ("●  LIVE  PLAY-BY-PLAY", (220, 30, 45), WHITE),
    "MOM": ("MOM  ·  DENISE REED", (255, 120, 180), (30, 10, 20)),
    "KAYLA": ("KAYLA  ·  LITTLE SISTER", (190, 130, 255), (20, 10, 30)),
    "GRANDPA": ("GRANDPA EARL", (120, 220, 150), (10, 30, 15)),
    "LINDA": ("LINDA DAWSON  ·  COACH'S WIFE", (90, 210, 210), (5, 30, 30)),
}
WALK_SPEED = 820
STRIDE = 340
GROUND_Y = 1795
MARKS = {0: [], 1: [540], 2: [310, 770], 3: [215, 540, 865], 4: [165, 415, 665, 915], 5: [130, 345, 560, 775, 990]}


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def ease_out_back(x):
    x = min(max(x, 0.0), 1.0)
    c1 = 1.70158
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


# ---------------------------------------------------------------- audio io

def load_audio(path, stereo=False, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-i", path]
    if dur:
        cmd += ["-t", str(dur)]
    cmd += ["-f", "f32le", "-ac", "2" if stereo else "1", "-ar", str(SR), "-"]
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return a.reshape(-1, 2) if stereo else a


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


RNG = np.random.default_rng(7)


def sfx_whoosh(d=0.7):
    n = int(SR * d)
    t = np.linspace(0, 1, n)
    x = RNG.standard_normal(n)
    env = np.sin(np.pi * t ** 0.6) ** 2
    out = np.zeros(n)
    for k, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500)]):
        out += bp(x, lo, hi) * np.clip(np.sin(np.pi * (t * 1.3 - k * 0.12)), 0, 1)
    return (out * env * 0.5).astype(np.float32)


def sfx_boom(d=1.6):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = 30 + 70 * np.exp(-t * 4)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 2.6) * 0.95
    x += lp(RNG.standard_normal(n), 900) * np.exp(-t * 18) * 0.6
    return x.astype(np.float32)


def sfx_whistle(d=0.9):
    n = int(SR * d)
    t = np.arange(n) / SR
    trill = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 34 * t))
    x = np.sin(2 * np.pi * 3050 * t) * (0.6 + 0.4 * trill) + 0.35 * np.sin(2 * np.pi * 3320 * t) * trill
    env = np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.12, 0, 1)
    return (x * env * 0.22).astype(np.float32)


def crowd(n, level=1.0, seed=0):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(n), 250, 2600, 2)
    x += 0.5 * bp(r.standard_normal(n), 120, 600, 2)
    mod = lp(r.standard_normal(n), 3, 1)
    mod = 1 + 0.6 * mod / (np.abs(mod).max() + 1e-6)
    x = x * mod
    return (x / (np.abs(x).max() + 1e-6) * level).astype(np.float32)


def sfx_roar(d=4.0, seed=1):
    n = int(SR * d)
    t = np.arange(n) / SR
    env = np.clip(t / 0.35, 0, 1) * np.clip((d - t) / 1.8, 0, 1)
    return crowd(n, 0.75, seed) * env


# ---------------------------------------------------------------- timeline

def _marks(cast):
    return {w: x for w, x in zip(cast, MARKS[len(cast)])}


def build_timeline(ep):
    """Lay out lines on the episode clock. Lines are grouped into location segments; characters walk
    in at the start of a segment, re-position when the cast changes, and walk out at its end."""
    items, segs, t = [], [], INTRO
    scene, cast = None, None

    def close(seg, t):
        if seg["cast"]:
            seg["exit"] = t + 0.1
            m = _marks(seg["cast"])
            n = len(seg["cast"])
            t = seg["exit"] + (W + 320 - min(m.values(), default=W)) / WALK_SPEED + 0.12 * (n - 1) + 0.05
        else:
            t += 0.25
        seg["end"] = t
        return t

    for i, (spk, text, opt) in enumerate(ep["lines"]):
        base = f"{BUILD}/tts/ep{ep['num']}_{i:02d}"
        audio = load_audio(base + ".mp3")
        words = json.load(open(base + ".json"))
        new_scene = opt.get("scene", scene)
        is_new = scene is None or (new_scene != scene and not opt.get("cont"))
        if is_new:
            new_cast = opt.get("cast") or CAST.get(new_scene, [])
            if segs:
                t = close(segs[-1], t)
            seg = dict(scene=new_scene, start=t, cast=new_cast, changes=[(t, new_cast)], casts={*new_cast})
            segs.append(seg)
            t += 1.05 if new_cast else 0.35
        elif opt.get("cast") and opt["cast"] != cast:
            new_cast = opt["cast"]
            seg["changes"].append((t, new_cast))
            seg["casts"] |= set(new_cast)
            seg["cast"] = new_cast
            t += 1.0
        else:
            new_cast = cast
        scene, cast = new_scene, new_cast
        dur = len(audio) / SR
        items.append(dict(i=i, spk=spk, text=text, opt=opt, scene=scene, seg=len(segs) - 1, t0=t, t1=t + dur,
                          audio=audio, words=words))
        t += dur + 0.32
        if opt.get("fx") in ("intercept", "touchdown"):
            t += 1.6
    t = close(segs[-1], t)
    for s in segs:
        s["moves"] = plan_moves(s)
    total = t + OUTRO
    return items, segs, total


def plan_moves(seg):
    """Per character: list of (start_time, x_from, x_to)."""
    moves = {w: [] for w in seg["casts"]}
    cur = {}
    for ci, (tc, cast) in enumerate(seg["changes"]):
        m = _marks(cast)
        entering = sorted([w for w in cast if w not in cur], key=lambda w: -m[w])
        for k, w in enumerate(entering):
            x0 = -320 - k * 230
            moves[w].append((tc + 0.05 + k * 0.1, x0, m[w]))
        for w in cast:
            if w in cur and cur[w] != m[w]:
                moves[w].append((tc + 0.05, cur[w], m[w]))
        for w in list(cur):
            if w not in cast:
                moves[w].append((tc + 0.05, cur[w], W + 320))
                del cur[w]
        cur.update(m)
    if seg.get("exit") is not None:
        for k, w in enumerate(sorted(cur, key=lambda w: -cur[w])):
            moves[w].append((seg["exit"] + k * 0.12, cur[w], W + 320))
    return moves


def actor_state(moves, t):
    """-> (x, moving, phase) or None before the character first appears."""
    if not moves:
        return -999, False, 0.0
    x, dist, moving = moves[0][1], 0.0, False
    for (s, a, b) in moves:
        if t < s:
            break
        dur = abs(b - a) / WALK_SPEED
        if t < s + dur:
            f = (t - s) / dur
            x = a + (b - a) * f
            dist += abs(b - a) * f
            moving = True
            break
        x = b
        dist += abs(b - a)
    return x, moving, dist / STRIDE


def caption_words(item):
    """Attach punctuation from the script text to TTS word timings; merge spelled acronyms."""
    text, ws = item["text"], item["words"]
    toks = text.split()
    out, ti = [], 0
    for w in ws:
        nw = norm(w["w"])
        disp = w["w"]
        found = False
        for j in range(ti, min(ti + 4, len(toks))):
            for k in range(j, min(j + 4, len(toks))):
                if norm(" ".join(toks[j:k + 1])) == nw:
                    disp, ti, found = " ".join(toks[j:k + 1]), k + 1, True
                    break
            if found:
                break
        if not found:
            for j in range(ti, min(ti + 4, len(toks))):
                if norm(toks[j]).startswith(nw) or nw.startswith(norm(toks[j])) and norm(toks[j]):
                    disp = toks[j]
                    ti = j + 1
                    break
        out.append(dict(w=disp, t=item["t0"] + w["t"], e=item["t0"] + w["t"] + w["d"]))
    merged = []
    for w in out:
        if merged and len(norm(w["w"])) == 1 and w["w"][0].isupper() and len(norm(merged[-1]["w"])) <= 2 \
                and merged[-1]["w"].rstrip(".,!?").isupper() and merged[-1].get("acr", len(merged[-1]["w"]) == 1):
            merged[-1] = dict(w=merged[-1]["w"].rstrip(".,!?") + w["w"], t=merged[-1]["t"], e=w["e"], acr=True)
        else:
            merged.append(w)
    for w in merged:
        w["w"] = w["w"].replace("...", "…")
    return merged


def chunk_words(words):
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        end = w["w"][-1] in ".!?…"
        if end or len(cur) >= 5 or (len(cur) >= 3 and w["w"].endswith(",")):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


# ---------------------------------------------------------------- plays

def resolve_keys(items, start_idx):
    ev = {}
    j = start_idx
    while j < len(items):
        it = items[j]
        if j > start_idx and not it["opt"].get("cont"):
            break
        for k, word in it["opt"].get("keys", {}).items():
            for w in it["words"]:
                if norm(w["w"]) == norm(word):
                    ev[k] = it["t0"] + w["t"]
                    break
            else:
                ev[k] = it["t0"]
        j += 1
    return ev


def make_play(kind, ev):
    """Return dict of players -> list of (time, x, Y) keyframes, and ball path fn."""
    snap = ev["snap"]
    catch = ev["catch"]
    throw = max(ev.get("throw", catch - 1.0), catch - 1.15)
    throw = min(throw, catch - 0.75)
    P = {}
    if kind == "intercept":
        los = 40
        cx = 26.65
        off = {"C": (cx, los - 0.6), "LG": (cx - 2.6, los - 0.8), "RG": (cx + 2.6, los - 0.8),
               "LT": (cx - 5.2, los - 1.1), "RT": (cx + 5.2, los - 1.1), "RB": (cx + 2.5, los - 6.5)}
        for k, (x, y) in off.items():
            P[k] = dict(team="O", num={"C": 61, "LG": 66, "RG": 72, "LT": 77, "RT": 74, "RB": 33}[k],
                        keys=[(0, x, y), (snap + 0.2, x, y), (snap + 1.4, x + (0.4 if x > cx else -0.4), y - 1.2),
                              (catch + 3, x, y - 1.5)])
        P["QB"] = dict(team="O", num=7, star="REED",
                       keys=[(0, cx, los - 5), (snap, cx, los - 5), (throw, cx, los - 8.5), (catch + 0.6, cx - 1, los - 6),
                             (catch + 2.5, cx - 4, los - 10)])
        P["WR1"] = dict(team="O", num=81, keys=[(0, 6, los - 0.6), (snap, 6, los - 0.6), (snap + 0.8, 8, los + 4),
                                                (catch, 19, los + 9.5), (catch + 2.5, 18, los + 4)])
        P["WR2"] = dict(team="O", num=88, keys=[(0, 47, los - 0.6), (snap, 47, los - 0.6), (catch, 45, los + 22),
                                                (catch + 3, 40, los + 10)])
        for k, x in zip(("DE1", "DT1", "DT2", "DE2"), (cx - 7, cx - 2, cx + 2, cx + 7)):
            P[k] = dict(team="D", num={"DE1": 91, "DT1": 97, "DT2": 95, "DE2": 99}[k],
                        keys=[(0, x, los + 0.8), (snap, x, los + 0.8), (snap + 1.4, x * 0.9 + cx * 0.1, los - 2),
                              (catch + 2, x, los - 6)])
        for k, x in zip(("LB1", "LB2", "LB3"), (cx - 8, cx, cx + 8)):
            P[k] = dict(team="D", num={"LB1": 52, "LB2": 54, "LB3": 50}[k],
                        keys=[(0, x, los + 5), (snap, x, los + 5), (catch, x, los + 7), (catch + 3, cx, los - 8)])
        P["CB1"] = dict(team="D", num=21, keys=[(0, 6, los + 6), (snap, 6, los + 6), (catch, 10, los + 12),
                                                 (catch + 3, 14, los - 6)])
        P["CB2"] = dict(team="D", num=29, keys=[(0, 47, los + 6), (snap, 47, los + 6), (catch, 46, los + 16)])
        P["FS"] = dict(team="D", num=31, keys=[(0, 36, los + 15), (snap, 36, los + 15), (catch, 40, los + 18),
                                                (catch + 3, 30, los - 15)])
        score = ev.get("score", catch + 3.6)
        P["S24"] = dict(team="D", num=24, star="KING",
                        keys=[(0, 18, los + 14), (snap, 18, los + 14), (throw, 19.5, los + 11.5),
                              (catch, 19.5, los + 9.6), (catch + 0.4, 20, los + 7),
                              (score, 24, -3), (score + 3, 26, -6)])
        holder_after = "S24"
        target = (19.5, los + 9.8)
        def cam(t, Y):
            base = los - 6
            f = smooth((t - catch) / 0.8)
            return (art.PLAY_CFG, base + (min(base, Y - 6) - base) * f, 28)
    else:  # touchdown
        los = 92
        cx = 26.65
        for k, x in zip(("C", "LG", "RG", "LT", "RT"), (cx, cx - 2.6, cx + 2.6, cx - 5.2, cx + 5.2)):
            P[k] = dict(team="O", num={"C": 61, "LG": 66, "RG": 72, "LT": 77, "RT": 74}[k],
                        keys=[(0, x, los - 0.8), (snap + 0.2, x, los - 0.8), (snap + 1.6, x, los - 2), (catch + 4, x, los - 2.5)])
        P["QB"] = dict(team="O", num=7, star="REED",
                       keys=[(0, cx, los - 5), (snap, cx, los - 5), (ev.get("look", snap + 1), cx - 0.6, los - 7.5),
                             (throw, cx + 0.5, los - 8), (catch + 0.5, cx + 2, los - 6), (catch + 4, cx + 10, los + 3)])
        P["TE"] = dict(team="O", num=85, keys=[(0, cx + 8, los - 0.8), (snap, cx + 8, los - 0.8), (catch, cx + 12, los + 7)])
        P["WR1"] = dict(team="O", num=81, keys=[(0, 6, los - 0.6), (snap, 6, los - 0.6), (catch, 9, los + 13)])
        P["WR2"] = dict(team="O", num=88, star="JONES",
                        keys=[(0, 45, los - 0.6), (snap, 45, los - 0.6), (snap + 1.3, 44, los + 7),
                              (catch, 44, los + 11.6), (catch + 1.2, 45.5, los + 14), (catch + 4, 42, los + 15)])
        for k, x in zip(("DE1", "DT1", "DT2", "DE2"), (cx - 7, cx - 2, cx + 2, cx + 7)):
            P[k] = dict(team="D", num={"DE1": 91, "DT1": 97, "DT2": 95, "DE2": 99}[k],
                        keys=[(0, x, los + 0.8), (snap, x, los + 0.8), (snap + 1.6, x * 0.9 + cx * 0.1, los - 2.5)])
        for k, x in zip(("LB1", "LB2"), (cx - 6, cx + 6)):
            P[k] = dict(team="D", num={"LB1": 52, "LB2": 54}[k],
                        keys=[(0, x, los + 4), (snap, x, los + 4), (catch, x + 3, los + 6)])
        P["CB1"] = dict(team="D", num=21, keys=[(0, 7, los + 4), (snap, 7, los + 4), (catch, 10, los + 12)])
        P["CB2"] = dict(team="D", num=29, keys=[(0, 46, los + 4), (snap, 46, los + 4), (catch, 46.5, los + 10),
                                                 (catch + 1.2, 48, los + 12.5)])
        P["S24"] = dict(team="D", num=24, star="KING",
                        keys=[(0, 28, los + 9), (snap, 28, los + 9), (ev.get("bite", snap + 2), 20, los + 9),
                              (catch, 16, los + 10), (catch + 2, 30, los + 12)])
        holder_after = "WR2"
        target = (44, los + 11.8)
        cam = lambda t, Y: (art.PLAY_CFG, 86 + 2 * smooth((t - snap) / 4), 28)

    def pos(p, t):
        ks = P[p]["keys"]
        if t <= ks[0][0]:
            return ks[0][1:]
        for a, b in zip(ks, ks[1:]):
            if a[0] <= t <= b[0]:
                f = smooth((t - a[0]) / max(b[0] - a[0], 1e-6))
                return a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f
        return ks[-1][1:]

    def ball(t):
        """(x, Y, height)"""
        if t < snap:
            x, y = pos("C", t)
            return x, y + 0.6, 0.3
        if t < snap + 0.25:
            f = (t - snap) / 0.25
            c, q = pos("C", t), pos("QB", t)
            return c[0] + (q[0] - c[0]) * f, c[1] + (q[1] - c[1]) * f, 1.2
        if t < throw:
            q = pos("QB", t)
            return q[0] + 0.4, q[1], 2.0
        if t < catch:
            f = (t - throw) / (catch - throw)
            q = pos("QB", throw)
            return q[0] + (target[0] - q[0]) * f, q[1] + (target[1] - q[1]) * f, 2 + 9 * math.sin(math.pi * f) * (1.1 if kind == "touchdown" else 0.6)
        h = pos(holder_after, t)
        return h[0] + 0.4, h[1] + 0.2, 1.6

    def camera(t):
        bx, bY, _ = ball(t)
        return cam(t, bY)

    return dict(P=P, pos=pos, ball=ball, camera=camera, snap=snap, throw=throw, catch=catch,
                score=ev.get("score"), kind=kind)


PLAY_TOP = None


def draw_play(img, play, t):
    global PLAY_TOP
    if PLAY_TOP is None:
        PLAY_TOP = art.bg_play_top()
    cam = play["camera"](t)
    img.paste(PLAY_TOP, (0, 0))
    art.draw_field(img, cam[0], cam[1], cam[2])
    d = ImageDraw.Draw(img, "RGBA")
    # line of scrimmage + first down lines (before snap / early)
    los = play["P"]["C"]["keys"][0][2] + 0.6
    if t < play["catch"]:
        a = project(0.5, los, cam)
        b = project(52.8, los, cam)
        d.line([a[:2], b[:2]], fill=(40, 120, 255, 220), width=max(2, int(7 * a[2])))
        if play["kind"] == "intercept":
            a = project(0.5, los + 7, cam)
            b = project(52.8, los + 7, cam)
            d.line([a[:2], b[:2]], fill=(255, 220, 0, 220), width=max(2, int(7 * a[2])))
    # players sorted far -> near
    pl = []
    for k, p in play["P"].items():
        x, Y = play["pos"](k, t)
        sx, sy, sc = project(x, Y, cam)
        pl.append((sy, k, p, sx, sc))
    pl.sort()
    f_num = {}
    for sy, k, p, sx, sc in pl:
        if sy < 560 or sy > H + 80:
            continue
        r = 42 * sc
        d.ellipse((sx - r * 1.1, sy - r * 0.35, sx + r * 1.1, sy + r * 0.35), fill=(0, 0, 0, 90))
        body = NAVY if p["team"] == "O" else (240, 240, 245)
        trim = GOLD if p["team"] == "O" else WOLF
        cy = sy - r * 1.05
        d.ellipse((sx - r, cy - r, sx + r, cy + r), fill=body, outline=trim, width=max(2, int(4 * sc)))
        sz = max(8, int(40 * sc))
        fn = f_num.get(sz) or f_num.setdefault(sz, font("Anton.ttf", sz))
        d.text((sx, cy), str(p["num"]), font=fn, fill=trim if p["team"] == "O" else WOLF, anchor="mm")
        if p.get("star") and p["star"] != "CATCH":
            tag = f"#{p['num']} {p['star']}"
            ft = font("Inter-Black.otf", 30)
            tw = d.textlength(tag, font=ft)
            ty = cy - r - 46
            col = GOLD if p["team"] == "O" else (220, 30, 45)
            d.rounded_rectangle((sx - tw / 2 - 14, ty - 22, sx + tw / 2 + 14, ty + 22), 10, fill=col + (235,))
            d.polygon([(sx - 9, ty + 21), (sx + 9, ty + 21), (sx, ty + 33)], fill=col + (235,))
            d.text((sx, ty), tag, font=ft, fill=(15, 15, 20) if p["team"] == "O" else WHITE, anchor="mm")
    # ball
    bx, bY, bh = play["ball"](t)
    sx, sy, sc = project(bx, bY, cam)
    by = sy - bh * 9 * sc
    d.ellipse((sx - 10 * sc, sy - 4 * sc, sx + 10 * sc, sy + 4 * sc), fill=(0, 0, 0, 110))
    rx, ry = 18 * sc + 4, 11 * sc + 3
    d.ellipse((sx - rx, by - ry, sx + rx, by + ry), fill=(130, 70, 30), outline=(250, 250, 250), width=2)
    # ball trail during flight
    if play["throw"] < t < play["catch"]:
        for k in range(1, 8):
            tt = t - k * 0.035
            if tt < play["throw"]:
                break
            x2, Y2, h2 = play["ball"](tt)
            px, py, ps = project(x2, Y2, cam)
            d.ellipse((px - 6 * ps, py - h2 * 9 * ps - 6 * ps, px + 6 * ps, py - h2 * 9 * ps + 6 * ps),
                      fill=(255, 230, 150, 160 - k * 20))


# ---------------------------------------------------------------- film board

def draw_board(img, state, p, t):
    """Telestrator diagram on the film-room screen. img is the full bg (1240x2100)."""
    x0, y0, x1, y1 = art.SCREEN
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((x0, y0, x1, y1), fill=(22, 84, 44))
    for k in range(7):
        yy = y1 - 40 - k * 95
        d.line([(x0, yy), (x1, yy)], fill=(220, 230, 220, 150), width=3)
    d.text((x0 + 24, y0 + 18), "WOLVES D  ·  3RD & 7  ·  Q2  12:41", font=font("Inter-Bold.otf", 26), fill=(240, 240, 240, 200))
    d.text((x1 - 24, y0 + 18), "▌▌ PAUSED", font=font("Inter-Bold.otf", 26), fill=(255, 210, 0, 230), anchor="ra")
    M = lambda fx, fy: (x0 + 40 + fx * (x1 - x0 - 80), y1 - 60 - fy * (y1 - y0 - 140))
    los = 0.2
    d.line([M(0, los), M(1, los)], fill=(60, 140, 255, 230), width=5)
    fo = font("Anton.ttf", 34)
    # offense: O's
    for fx in (0.08, 0.40, 0.45, 0.5, 0.55, 0.6, 0.92):
        cx, cy = M(fx, los - 0.06)
        d.ellipse((cx - 20, cy - 20, cx + 20, cy + 20), outline=WHITE, width=5)
    qx, qy = M(0.5, los - 0.2)
    d.ellipse((qx - 20, qy - 20, qx + 20, qy + 20), outline=GOLD, width=6)
    d.text((qx, qy + 42), "QB", font=font("Inter-Black.otf", 24), fill=GOLD, anchor="mm")
    # defense X's
    def X(fx, fy, col=(255, 80, 80), lab=None):
        cx, cy = M(fx, fy)
        d.line([(cx - 17, cy - 17), (cx + 17, cy + 17)], fill=col, width=6)
        d.line([(cx - 17, cy + 17), (cx + 17, cy - 17)], fill=col, width=6)
        if lab:
            d.text((cx, cy - 36), lab, font=fo, fill=col, anchor="mm")
    for fx in (0.42, 0.48, 0.53, 0.58):
        X(fx, los + 0.05)
    for fx in (0.32, 0.5, 0.68):
        X(fx, los + 0.22)
    X(0.1, los + 0.18)
    X(0.9, los + 0.18)
    s24y = los + 0.62
    if state in ("cover3", "lookoff"):
        s24y = los + 0.62 - 0.22 * (p if state == "cover3" else 1)
    X(0.28, s24y, (255, 230, 60), "24")
    X(0.72, los + 0.62, lab="31")
    if state == "cover2":
        for fx0, fx1 in ((0.02, 0.5), (0.5, 0.98)):
            a, b = M(fx0, los + 0.5), M(fx1, 1.0)
            d.rectangle((a[0], b[1], b[0], a[1]), fill=(80, 160, 255, int(70 * p)), outline=(120, 190, 255, int(220 * p)), width=3)
        d.text(M(0.5, 0.97), "COVER 2", font=font("Anton.ttf", 54), fill=(150, 210, 255, int(255 * p)), anchor="mt")
    if state in ("circle24", "cover3", "lookoff"):
        cx, cy = M(0.28, s24y)
        r = 48 + 4 * math.sin(t * 8)
        end = 360 * (p if state == "circle24" else 1)
        d.arc((cx - r, cy - r, cx + r, cy + r), -90, -90 + end, fill=(255, 230, 0, 255), width=9)
    if state == "cover3":
        for fx0, fx1 in ((0.02, 0.34), (0.34, 0.66), (0.66, 0.98)):
            a, b = M(fx0, los + 0.55), M(fx1, 1.0)
            d.rectangle((a[0], b[1], b[0], a[1]), fill=(255, 120, 80, int(60 * p)), outline=(255, 150, 120, int(220 * p)), width=3)
        d.text(M(0.5, 0.97), "COVER 3 — DISGUISED", font=font("Anton.ttf", 54), fill=(255, 190, 150, int(255 * p)), anchor="mt")
        a, b = M(0.28, los + 0.62), M(0.28, s24y + 0.04)
        d.line([a, b], fill=(255, 230, 0, 230), width=6)
    if state == "lookoff":
        # eyes left (dashed), throw right (solid arrow)
        ex, ey = M(0.12, 0.7)
        n = 12
        for k in range(int(n * min(p * 2, 1))):
            if k % 2 == 0:
                f0, f1 = k / n, (k + 1) / n
                d.line([(qx + (ex - qx) * f0, qy + (ey - qy) * f0), (qx + (ex - qx) * f1, qy + (ey - qy) * f1)],
                       fill=(255, 255, 255, 220), width=6)
        d.text(M(0.13, 0.78), "EYES", font=font("Anton.ttf", 44), fill=WHITE, anchor="mm")
        if p > 0.5:
            pp = (p - 0.5) * 2
            tx, ty = M(0.86, 0.75)
            mx, my = qx + (tx - qx) * pp, qy + (ty - qy) * pp
            d.line([(qx, qy), (mx, my)], fill=GOLD, width=9)
            ang = math.atan2(my - qy, mx - qx)
            d.polygon([(mx + 26 * math.cos(ang), my + 26 * math.sin(ang)),
                       (mx + 18 * math.cos(ang + 2.3), my + 18 * math.sin(ang + 2.3)),
                       (mx + 18 * math.cos(ang - 2.3), my + 18 * math.sin(ang - 2.3))], fill=GOLD)
            d.text(M(0.86, 0.85), "THROW", font=font("Anton.ttf", 44), fill=GOLD, anchor="mm")


# ---------------------------------------------------------------- frame parts

def caption_image(chunk, active, spk):
    fnt = font("Inter-Black.otf", 74)
    words = [c["w"] for c in chunk]
    space = 20
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    widths = [dummy.textlength(w, font=fnt) for w in words]
    lines, cur, cw = [], [], 0
    for i, w in enumerate(widths):
        if cur and cw + space + w > 920:
            lines.append(cur)
            cur, cw = [], 0
        cur.append(i)
        cw += (space if len(cur) > 1 else 0) + w
    lines.append(cur)
    lh = 92
    img = Image.new("RGBA", (1000, lh * len(lines) + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for li, ln in enumerate(lines):
        tw = sum(widths[i] for i in ln) + space * (len(ln) - 1)
        x = 500 - tw / 2
        y = 15 + li * lh
        for i in ln:
            col = (255, 214, 0) if i == active else WHITE
            if i == active:
                pad = 8
                d.rounded_rectangle((x - pad, y + 4, x + widths[i] + pad, y + 84), 14,
                                    fill=SPEAKER_STYLE[spk][1] + (255,) if spk != "MARCUS" else (190, 120, 0, 255))
                col = WHITE
            d.text((x, y), words[i], font=fnt, fill=col, stroke_width=7, stroke_fill=(0, 0, 0))
            x += widths[i] + space
    return img


def name_chip(spk):
    label, bg, fg = SPEAKER_STYLE[spk]
    f = font("Inter-Black.otf", 34)
    tw = ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(label, font=f)
    im = Image.new("RGBA", (int(tw) + 48, 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, 59), 14, fill=bg + (245,))
    d.text((24, 30), label, font=f, fill=fg, anchor="lm")
    return im


def hud(ep, scoreboard, t, total):
    im = Image.new("RGBA", (W, 330), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    # top gradient for legibility
    for y in range(330):
        a = int(235 * (1 - y / 330) ** 0.9)
        d.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    d.text((W / 2, 92), SERIES, font=font("Anton.ttf", 70), fill=WHITE, anchor="mm", stroke_width=2, stroke_fill=(0, 0, 0))
    d.rectangle((W / 2 - 170, 134, W / 2 + 170, 139), fill=GOLD)
    d.text((W / 2, 168), f"EPISODE {ep['num']}  ·  {ep['title']}", font=font("Inter-Black.otf", 32), fill=GOLD, anchor="mm")
    if scoreboard:
        h, a, q, clk = scoreboard
        y = 222
        bx0, bx1 = 140, 940
        d.rounded_rectangle((bx0, y, bx1, y + 74), 16, fill=(8, 10, 18, 235), outline=(255, 255, 255, 60), width=2)
        d.rounded_rectangle((bx0 + 6, y + 6, 450, y + 68), 12, fill=NAVY)
        d.text((bx0 + 26, y + 37), "STALLIONS", font=font("Anton.ttf", 38), fill=WHITE, anchor="lm")
        d.text((440, y + 37), str(h), font=font("Anton.ttf", 50), fill=GOLD, anchor="rm")
        d.rounded_rectangle((458, y + 6, 762, y + 68), 12, fill=WOLF)
        d.text((478, y + 37), "WOLVES", font=font("Anton.ttf", 38), fill=WHITE, anchor="lm")
        d.text((752, y + 37), str(a), font=font("Anton.ttf", 50), fill=WHITE, anchor="rm")
        d.text((850, y + 37), f"{q}  {clk}", font=font("Anton.ttf", 36), fill=(255, 214, 0) if q == "FINAL" else WHITE, anchor="mm")
    return im


# ---------------------------------------------------------------- episode

def render_episode(num):
    random.seed(num)
    ep = next(e for e in EPISODES if e["num"] == num)
    items, segs, total = build_timeline(ep)
    nfr = int(total * FPS)
    os.makedirs(OUT, exist_ok=True)

    # ------------------------------------------------ audio
    N = int(total * SR) + SR
    voice = np.zeros(N, np.float32)
    sfx = np.zeros(N, np.float32)
    amb = np.zeros(N, np.float32)
    speaking = np.zeros(N, np.float32)

    def put(buf, a, t, g=1.0):
        s = int(t * SR)
        e = min(N, s + len(a))
        buf[s:e] += a[: e - s] * g

    for it in items:
        put(voice, it["audio"], it["t0"])
        speaking[int(it["t0"] * SR): int(it["t1"] * SR)] = 1
        it["env"] = None
    put(sfx, sfx_boom(), 0.05, 0.9)
    put(sfx, sfx_whoosh(), 0.0, 0.6)
    put(sfx, sfx_whoosh(), total - OUTRO - 0.3, 0.5)
    stadium_scenes = ("sideline", "play", "broadcast", "bench", "celebrate", "stands")
    for s in segs[1:]:
        put(sfx, sfx_whoosh(0.55), s["start"] - 0.35, 0.45)
    step = lp(RNG.standard_normal(int(SR * 0.07)), 500) * np.exp(-np.arange(int(SR * 0.07)) / SR * 60)
    step = (step / np.abs(step).max()).astype(np.float32)
    for s in segs:
        for w, mv in s["moves"].items():
            for (st0, a, b) in mv:
                n_steps = int(abs(b - a) / (STRIDE / 2))
                for k in range(n_steps):
                    ts = st0 + k * (STRIDE / 2) / WALK_SPEED
                    if s["start"] <= ts <= s["end"]:
                        put(sfx, step, ts, 0.12 * rig.SPECS[w]["scale"])
    for it in items:
        fx = it["opt"].get("fx")
        if fx == "boom":
            put(sfx, sfx_boom(), it["t0"] + 0.2, 0.7)
        if fx == "whistle":
            put(sfx, sfx_whistle(), it["t1"] + 0.05, 0.8)
    # camera shutters at the press conference
    for it in items:
        if it["scene"] == "press":
            rr = random.Random(num)
            for _ in range(int((it["t1"] - it["t0"] + 1) * 3)):
                n = int(SR * 0.05)
                click = (RNG.standard_normal(n) * np.exp(-np.arange(n) / SR * 120)).astype(np.float32)
                put(sfx, bp(click, 1500, 7000).astype(np.float32), it["t0"] - 0.4 + rr.uniform(0, it["t1"] - it["t0"] + 0.8), 0.35)
    # crowd ambience under stadium scenes
    base_crowd = crowd(N, 0.11, num)
    mask = np.zeros(N, np.float32)
    for it in items:
        pass
    for s in segs:
        if s["scene"] in stadium_scenes:
            mask[int(s["start"] * SR): int(s["end"] * SR)] = 1.6 if s["scene"] in ("stands", "celebrate") else 1
    mask = lp(mask, 1.5, 1).astype(np.float32)
    amb += base_crowd * mask

    # plays
    plays = {}
    for idx, it in enumerate(items):
        if it["opt"].get("play") and not it["opt"].get("cont"):
            ev = resolve_keys(items, idx)
            pl = make_play(it["opt"]["play"], ev)
            plays[idx] = pl
            put(sfx, sfx_whistle(0.4), pl["snap"] - 0.6, 0.35)
            put(sfx, sfx_roar(6.0, num), pl["catch"] - 0.2, 1.0)
            put(sfx, sfx_boom(), pl["catch"] - 0.05, 0.8)
            if pl["kind"] == "touchdown":
                put(sfx, sfx_roar(7.0, num + 5), pl["catch"] + 1.0, 0.8)
            j = idx + 1
            while j < len(items) and items[j]["opt"].get("cont"):
                plays[j] = pl
                j += 1
    # music with ducking
    music = load_audio(f"{MUSIC_DIR}/{ep['music']}", stereo=True, start=ep.get("music_start", 0), dur=total + 1)
    if len(music) < N:
        music = np.pad(music, ((0, N - len(music)), (0, 0)))
    music = music[:N]
    duck = lp(speaking, 3, 1)
    duck = np.clip(duck / (duck.max() + 1e-6), 0, 1)
    gain = 0.62 - 0.46 * duck
    tt = np.arange(N) / SR
    gain *= np.clip(tt / 0.4, 0, 1) * np.clip((total - tt) / 1.6, 0, 1)
    mix = music * gain[:, None]
    mono = voice * 1.05 + sfx + amb
    mix = mix + mono[:, None]
    mix = mix[: int(total * SR)]
    peak = np.abs(mix).max()
    mix = mix / max(peak, 1e-6) * 0.95
    wav = f"{OUT}/.ep{num}.f32"
    mix.astype(np.float32).tofile(wav)

    # per-frame mouth level
    def level(it, t):
        s = int((t - it["t0"]) * SR)
        a = it["audio"][max(0, s - 800): s + 800]
        return float(np.sqrt((a ** 2).mean())) if len(a) else 0.0

    # ------------------------------------------------ visuals
    actors = {w: rig.Actor(w) for s in segs for w in s['casts']}
    fg_stands, fg_press = art.fg_stands(), art.fg_press()
    td_catch = next((p['catch'] for p in plays.values() if p['kind'] == 'touchdown'), None)
    bgs = {
        "locker": art.bg_locker(),
        "film": art.bg_film(),
        "sideline": art.bg_stadium(blur=7),
        "bench": art.bg_bench(),
        "office": art.bg_office(),
        "practice": art.bg_practice(False),
        "practice_sunset": art.bg_practice(True),
        "tunnel": art.bg_tunnel(),
        "press": art.bg_press(),
        "home": art.bg_home(),
        "stands": art.bg_stands(),
        "celebrate": art.bg_stadium(blur=6),
        "broadcast": art.bg_stadium(),
    }
    intro_bg = ImageEnhance.Brightness(art.bg_stadium(blur=12)).enhance(0.45)
    board_cache = {}
    cap_cache = {}
    chips = {k: name_chip(k) for k in SPEAKER_STYLE}

    # caption chunks with timing
    chunks = []
    for it in items:
        cw = caption_words(it)
        for ch in chunk_words(cw):
            chunks.append(dict(spk=it["spk"], words=ch, t0=ch[0]["t"] - 0.05, it=it))
    for a, b in zip(chunks, chunks[1:]):
        a["t1"] = min(b["t0"], a["it"]["t1"] + 0.25) if a["it"] is b["it"] else a["it"]["t1"] + 0.2
    chunks[-1]["t1"] = chunks[-1]["it"]["t1"] + 0.3

    # scoreboard state over time
    score_events = []
    for idx, it in enumerate(items):
        if "score" in it["opt"]:
            score_events.append((it["t0"] - 0.6, tuple(it["opt"]["score"])))
        if "score_after" in it["opt"]:
            pl = plays.get(idx)
            tt0 = (pl["score"] or pl["catch"] + 0.5) if pl else it["t1"]
            score_events.append((tt0, ("SA",) + tuple(it["opt"]["score_after"]) + (it["opt"].get("clock_after"),)))
    score_events.sort(key=lambda e: e[0])

    def scoreboard_at(t):
        sb = None
        for te, val in score_events:
            if t >= te:
                if val[0] == "SA":
                    sb = (val[1], val[2], sb[2], val[3] or sb[3])
                else:
                    sb = val
        tdp = next((p for p in plays.values() if p["kind"] == "touchdown"), None)
        if sb and tdp and sb[2] == "4TH":
            pl = tdp
            if t > pl["snap"]:
                left = max(0, 8 * (1 - (t - pl["snap"]) / (pl["catch"] - pl["snap"])))
                sb = (sb[0], sb[1], sb[2], f"0:{int(math.ceil(left)):02d}")
        return sb

    hud_cache = {}
    confetti = [(random.uniform(0, W), random.uniform(-1900, 0), random.uniform(220, 520), random.uniform(0, 6.28),
                 random.choice([GOLD, WHITE, (40, 90, 220), (255, 214, 0)])) for _ in range(170)]
    blink_times = sorted(random.uniform(0, total) for _ in range(int(total / 2.6)))

    preview = [float(x) for x in os.environ.get("PREVIEW", "").split(",") if x]
    if preview:
        frames_wanted = {int(x * FPS) for x in preview}
    ff = None if preview else subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", wav,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-movflags", "+faststart",
        "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-shortest", f"{OUT}/FourthQuarter_Ep{num}_{ep['title'].title().replace(' ', '')}.mp4"],
        stdin=subprocess.PIPE)

    def seg_at(t):
        cur = segs[0]
        for s in segs:
            if s["start"] <= t:
                cur = s
        return cur

    def item_at(t, si):
        cur = None
        for it in items:
            if it["seg"] == si and (cur is None or it["t0"] - 0.5 <= t):
                cur = it
        return cur

    def active_speaker(t, si):
        cur = None
        for it in items:
            if it["seg"] == si and it["t0"] - 0.15 <= t:
                cur = it
        return cur

    blink_off = {w: k * 0.77 for k, w in enumerate(rig.SPECS)}
    for fi in range(nfr):
        t = fi / FPS
        if preview and fi not in frames_wanted and not any(0 < f - fi < 12 for f in frames_wanted):
            continue
        frame = None
        if t < INTRO:
            frame = intro_card(ep, t, intro_bg)
        elif t >= total - OUTRO:
            frame = outro_card(ep, t - (total - OUTRO), intro_bg)
        else:
            seg = seg_at(t)
            si = segs.index(seg)
            it = item_at(t, si)
            scene = seg["scene"]
            sp = active_speaker(t, si)
            idx = items.index(it)
            s0 = seg["start"]
            st = t - s0
            if scene == "play":
                frame = Image.new("RGB", (W, H))
                draw_play(frame, plays[idx], t)
            else:
                bg = bgs[scene]
                if scene == "film":
                    state = None
                    st_t = s0
                    for j in range(0, idx + 1):
                        if items[j]["scene"] == "film" and items[j]["opt"].get("board"):
                            state, st_t = items[j]["opt"]["board"], items[j]["t0"]
                    p = smooth((t - st_t) / 1.0)
                    key = (state, round(p * 12), int(t * 8) % 4 if state in ("circle24", "cover3", "lookoff") else 0)
                    if key not in board_cache:
                        b = bg.copy()
                        draw_board(b, state, round(p * 12) / 12, key[2] / 8 * 2)
                        board_cache[key] = b
                    bg = board_cache[key]
                pan = st / 14.0
                ox = 80 + 70 * math.sin(pan * 1.3 + num)
                oy = 90 - 80 * smooth(min(pan, 1)) if scene != "broadcast" else 170 - 160 * smooth(st / 8)
                if scene == "broadcast":
                    zoom = 1 + 0.05 * smooth(st / 8)
                    cw, chh = int(W / zoom), int(H / zoom)
                    crop = bg.crop((int(ox), int(oy), int(ox) + cw, int(oy) + chh)).resize((W, H), Image.BILINEAR)
                else:
                    crop = bg.crop((int(ox), int(oy), int(ox) + W, int(oy) + H))
                frame = crop.copy()
            frame = frame.convert("RGBA")
            # stadium camera flashes
            if scene in ("sideline", "broadcast", "celebrate", "bench", "press"):
                d = ImageDraw.Draw(frame, "RGBA")
                rnd = random.Random(fi)
                for _ in range({"celebrate": 14, "press": 3}.get(scene, 5)):
                    x, y = rnd.uniform(0, W), rnd.uniform(470, 980)
                    if scene == "press":
                        if rnd.random() < 0.6:
                            continue
                        frame.alpha_composite(FLASH, (int(x) - 300, int(y) - 300))
                        continue
                    r = rnd.uniform(3, 9)
                    d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 240, rnd.randint(90, 230)))
            # characters (full bodies, walking between places)
            if seg["casts"]:
                d = ImageDraw.Draw(frame, "RGBA")
                speaking = sp is not None and sp["t0"] <= t <= sp["t1"] + 0.05
                in_cast = sp is not None and sp["spk"] in seg["casts"]
                states = {}
                for w in seg["casts"]:
                    x, moving, phase = actor_state(seg["moves"][w], t)
                    if -300 < x < W + 300:
                        states[w] = (x, moving, phase)
                for w, (x, moving, phase) in states.items():
                    sc = rig.SPECS[w]["scale"]
                    d.ellipse((x - 120 * sc, GROUND_Y - 16, x + 120 * sc, GROUND_Y + 14), fill=(0, 0, 0, 80))
                order = sorted(states, key=lambda w: (-rig.SPECS[w]["scale"], sp is not None and sp["spk"] == w))
                for k, w in enumerate(order):
                    x, moving, phase = states[w]
                    act = actors[w]
                    is_spk = sp is not None and sp["spk"] == w and speaking
                    lift = 0
                    if moving:
                        pose = ("walk", int(phase * rig.Actor.WALK_FRAMES) % rig.Actor.WALK_FRAMES)
                    elif scene == "celebrate":
                        fast = 7 if w == "GRANDPA" else 5
                        pose = (("cheer", "point")[int(t * 3) % 2] if w == "GRANDPA" else "cheer", int(t * 4 + k) % 2)
                        lift = int(45 * abs(math.sin(t * fast + k * 1.3)))
                    elif is_spk and sp["opt"].get("pose") == "point":
                        pose = ("point", int(t * 3) % 2)
                        lift = int(12 * abs(math.sin(t * 6)))
                    elif is_spk:
                        g = (math.sin((t - sp["t0"]) * 3.4) + 1) / 2
                        pose = ("talk", int(round(g * (rig.Actor.TALK_FRAMES - 1))))
                    else:
                        pose = ("idle", 0)
                    m = 0
                    if is_spk:
                        lv = level(sp, t)
                        m = 2 if lv > 0.09 else (1 if lv > 0.03 else 0)
                    bl = any(bt + blink_off[w] <= t < bt + blink_off[w] + 0.13 for bt in blink_times)
                    active = (not in_cast) or sp["spk"] == w or scene == "celebrate"
                    act.compose(frame, x, GROUND_Y, pose, m, bl, active=active, lift=lift)
                if scene == "stands":
                    frame.alpha_composite(fg_stands, (0, H - fg_stands.height))
                elif scene == "press":
                    frame.alpha_composite(fg_press, (0, H - fg_press.height))
                frame.alpha_composite(BOTTOM_FADE, (0, H - BOTTOM_FADE.height))
            # confetti
            if scene == "celebrate" or (scene == "play" and plays[idx]["kind"] == "touchdown" and t > plays[idx]["catch"]):
                t_c = t - (td_catch if scene == "play" and td_catch else s0)
                d = ImageDraw.Draw(frame, "RGBA")
                for (x0, y0, v, ph, col) in confetti:
                    y = y0 + v * t_c * 1.4
                    if 0 < y < H:
                        x = x0 + 30 * math.sin(t * 3 + ph)
                        w2 = 9 * abs(math.sin(t * 6 + ph)) + 2
                        d.rectangle((x - w2, y - 6, x + w2, y + 6), fill=col + (230,))
            # play overlays
            if scene == "play":
                pl = plays[idx]
                if t >= pl["catch"]:
                    word = "INTERCEPTED!" if pl["kind"] == "intercept" else "TOUCHDOWN!"
                    if pl["kind"] == "intercept" and pl["score"] and t >= pl["score"]:
                        word = "PICK SIX!"
                        k = t - pl["score"]
                    else:
                        k = t - pl["catch"]
                    col = (220, 30, 45) if pl["kind"] == "intercept" else GOLD
                    frame.alpha_composite(slam_text(word, col, k), (0, 250))
                if t < pl["snap"]:
                    d = ImageDraw.Draw(frame, "RGBA")
                    txt = "3RD & 7" if pl["kind"] == "intercept" else "4TH & GOAL"
                    d.rounded_rectangle((W / 2 - 190, 600, W / 2 + 190, 680), 16, fill=(255, 214, 0, 235))
                    d.text((W / 2, 640), txt, font=font("Anton.ttf", 56), fill=(10, 10, 10), anchor="mm")
            if scene == "broadcast":
                d = ImageDraw.Draw(frame, "RGBA")
                d.rounded_rectangle((60, 380, 260, 450), 12, fill=(220, 30, 45, 240))
                if int(t * 2) % 2 == 0:
                    d.ellipse((82, 404, 104, 426), fill=WHITE)
                d.text((180, 415), "LIVE", font=font("Anton.ttf", 46), fill=WHITE, anchor="mm")
            # location label at the start of each new place
            if scene in LOCATIONS and st < 2.6:
                frame.alpha_composite(location_label(scene, st), (0, 0))
            # HUD
            sb = scoreboard_at(t)
            hk = (sb,)
            if hk not in hud_cache:
                hud_cache[hk] = hud(ep, sb, t, total)
            frame.alpha_composite(hud_cache[hk], (0, 0))
            # caption
            ch = None
            for c in chunks:
                if c["t0"] <= t < c["t1"]:
                    ch = c
            if ch:
                act = -1
                for wi, w in enumerate(ch["words"]):
                    if w["t"] - 0.03 <= t:
                        act = wi
                key = (id(ch), act)
                if key not in cap_cache:
                    cap_cache[key] = caption_image(ch["words"], act, ch["spk"])
                cimg = cap_cache[key]
                age = t - ch["t0"]
                s = 0.82 + 0.18 * ease_out_back(age / 0.18)
                if s != 1.0:
                    cimg = cimg.resize((max(1, int(cimg.width * s)), max(1, int(cimg.height * s))), Image.BILINEAR)
                cy = 1520 if scene not in ("play", "broadcast") else 1690
                frame.alpha_composite(cimg, (int(W / 2 - cimg.width / 2), int(cy - cimg.height / 2 + 40)))
                chip = chips[ch["spk"]]
                frame.alpha_composite(chip, (int(W / 2 - chip.width / 2), int(cy - cimg.height / 2 - 40)))
            # shake on impacts
            shake = 0
            for it2 in items:
                if it2["opt"].get("fx") == "boom" and 0 <= t - it2["t0"] - 0.2 < 0.35:
                    shake = 14 * (1 - (t - it2["t0"] - 0.2) / 0.35)
            if scene == "play" and 0 <= t - plays[idx]["catch"] < 0.4:
                shake = 18 * (1 - (t - plays[idx]["catch"]) / 0.4)
            if shake:
                frame = frame.transform(frame.size, Image.AFFINE,
                                        (1, 0, random.uniform(-shake, shake), 0, 1, random.uniform(-shake, shake)))
            # scene cut flash
            for s2 in segs[1:]:
                if True:
                    dt = t - s2["start"]
                    if 0 <= dt < 0.3:
                        a = int(255 * (1 - dt / 0.3) * 0.85)
                        frame.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, a)))
            # intro fade-in from card
            if t - INTRO < 0.25:
                a = int(255 * (1 - (t - INTRO) / 0.25))
                frame.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, a)))
            frame = frame.convert("RGB")
        # progress bar
        d = ImageDraw.Draw(frame)
        d.rectangle((0, H - 10, W, H), fill=(30, 30, 40))
        d.rectangle((0, H - 10, int(W * t / total), H), fill=GOLD)
        if preview:
            if fi in frames_wanted:
                frame.save(f"{OUT}/prev_ep{num}_{t:05.1f}.png")
            continue
        ff.stdin.write(frame.tobytes())
    if preview:
        print("segments", [(s['scene'], round(s['start'], 1), round(s['end'], 1)) for s in segs], round(total, 1))
        return num, total
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    return num, total


BOTTOM_FADE = None
FLASH = None
LOCATIONS = {
    "office": "COACH'S OFFICE  ·  MONDAY, 11:40 PM",
    "locker": "STALLIONS LOCKER ROOM",
    "practice_sunset": "PRACTICE FIELD  ·  SUNSET",
    "film": "FILM ROOM  ·  6:00 AM",
    "practice": "PRACTICE FIELD  ·  WEDNESDAY",
    "tunnel": "STADIUM TUNNEL  ·  GAME DAY",
    "sideline": "STALLIONS SIDELINE",
    "bench": "STALLIONS TEAM BENCH",
    "celebrate": "FINAL WHISTLE",
    "press": "POST-GAME PRESS CONFERENCE",
    "home": "THE REED FAMILY HOUSE",
    "stands": "SECTION 107  ·  THE REED FAMILY",
}
LOC_CACHE = {}


def location_label(scene, st):
    """Slide-in place tag shown when the story moves to a new location."""
    a = smooth(st / 0.35) * (1 - smooth((st - 2.1) / 0.5))
    q = (scene, round(a * 20), round(smooth(st / 0.45) * 20))
    if q in LOC_CACHE:
        return LOC_CACHE[q]
    im = Image.new("RGBA", (W, 460), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = font("Inter-Black.otf", 34)
    text = LOCATIONS[scene]
    tw = d.textlength(text, font=f)
    x = 50 - (1 - q[2] / 20) * 120
    y = 345
    al = int(230 * q[1] / 20)
    d.rounded_rectangle((x, y, x + tw + 96, y + 66), 14, fill=(8, 10, 18, al))
    d.rectangle((x, y, x + 10, y + 66), fill=GOLD + (int(255 * q[1] / 20),))
    # map pin
    px, py = x + 44, y + 30
    d.ellipse((px - 13, py - 15, px + 13, py + 11), fill=GOLD + (int(255 * q[1] / 20),))
    d.polygon([(px - 11, py + 2), (px + 11, py + 2), (px, py + 22)], fill=GOLD + (int(255 * q[1] / 20),))
    d.ellipse((px - 5, py - 7, px + 5, py + 3), fill=(8, 10, 18, al))
    d.text((x + 72, y + 33), text, font=f, fill=(255, 255, 255, int(255 * q[1] / 20)), anchor="lm")
    LOC_CACHE[q] = im
    return im


def make_bottom_fade():
    im = Image.new("RGBA", (W, 420), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y in range(420):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, int(230 * (y / 420) ** 1.6)))
    return im


SLAM = {}


def slam_text(word, col, k):
    """Big animated banner text; k = seconds since trigger."""
    q = round(min(k, 0.6) * 30)
    key = (word, q, int(k * 6) % 2)
    if key in SLAM:
        return SLAM[key]
    s = 1.0 + 1.2 * (1 - ease_out_back(min(k, 0.6) / 0.35)) if k < 0.35 else 1.0
    s = max(s, 0.6)
    im = Image.new("RGBA", (W, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = font("Anton.ttf", int(150 * s))
    d.rectangle((0, 70, W, 230), fill=(0, 0, 0, 150))
    d.rectangle((0, 70, W, 78), fill=col + (255,))
    d.rectangle((0, 222, W, 230), fill=col + (255,))
    glow = Image.new("RGBA", (W, 300), (0, 0, 0, 0))
    ImageDraw.Draw(glow).text((W / 2, 150), word, font=f, fill=col + (255,), anchor="mm")
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    im.alpha_composite(glow)
    d.text((W / 2, 150), word, font=f, fill=WHITE if key[2] == 0 or k > 1.5 else col, anchor="mm",
           stroke_width=6, stroke_fill=(0, 0, 0))
    SLAM[key] = im
    return im


def intro_card(ep, t, bg):
    fr = bg.crop((80, 90 + int(t * 20), 80 + W, 90 + int(t * 20) + H)).convert("RGBA")
    d = ImageDraw.Draw(fr, "RGBA")
    # light sweep
    sx = -400 + (t / INTRO) * 2000
    sweep = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sweep).polygon([(sx, 0), (sx + 160, 0), (sx - 240, H), (sx - 400, H)], fill=(255, 220, 120, 40))
    fr.alpha_composite(sweep.filter(ImageFilter.GaussianBlur(30)))
    a = ease_out_back(t / 0.5)
    s = 1.5 - 0.5 * a
    f = font("Anton.ttf", int(170 * s))
    d.text((W / 2, 780), "FOURTH", font=f, fill=(255, 255, 255, int(255 * min(1, t / 0.3))), anchor="mm",
           stroke_width=4, stroke_fill=(0, 0, 0))
    a2 = ease_out_back((t - 0.2) / 0.5)
    f2 = font("Anton.ttf", int(170 * (1.5 - 0.5 * a2)))
    if t > 0.2:
        d.text((W / 2, 960), "QUARTER", font=f2, fill=GOLD + (int(255 * min(1, (t - 0.2) / 0.3)),), anchor="mm",
               stroke_width=4, stroke_fill=(0, 0, 0))
    if t > 0.7:
        p = smooth((t - 0.7) / 0.4)
        wbar = int(360 * p)
        d.rectangle((W / 2 - wbar, 1080, W / 2 + wbar, 1088), fill=WHITE)
        d.text((W / 2, 1150), f"EPISODE {ep['num']}", font=font("Inter-Black.otf", 50),
               fill=(255, 255, 255, int(255 * p)), anchor="mm")
        d.text((W / 2, 1240), ep["title"], font=font("Anton.ttf", 110), fill=GOLD + (int(255 * p),), anchor="mm",
               stroke_width=3, stroke_fill=(0, 0, 0))
    if t > INTRO - 0.3:
        a = int(255 * (t - (INTRO - 0.3)) / 0.3)
        fr.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, a)))
    return fr.convert("RGB")


def outro_card(ep, t, bg):
    fr = bg.crop((80, 90, 80 + W, 90 + H)).convert("RGBA")
    d = ImageDraw.Draw(fr, "RGBA")
    p = smooth(t / 0.5)
    if ep["next"]:
        d.text((W / 2, 700), "NEXT EPISODE", font=font("Inter-Black.otf", 56), fill=(255, 255, 255, int(255 * p)), anchor="mm")
        d.text((W / 2, 830), ep["next"], font=font("Anton.ttf", 130), fill=GOLD + (int(255 * p),), anchor="mm",
               stroke_width=3, stroke_fill=(0, 0, 0))
        d.text((W / 2, 980), f"PART {ep['num'] + 1} OF 5  ·  FOLLOW FOR MORE", font=font("Inter-Bold.otf", 40),
               fill=(220, 220, 230, int(255 * p)), anchor="mm")
    else:
        d.text((W / 2, 760), "THE END", font=font("Anton.ttf", 170), fill=GOLD + (int(255 * p),), anchor="mm",
               stroke_width=3, stroke_fill=(0, 0, 0))
        d.text((W / 2, 920), "THANKS FOR WATCHING", font=font("Inter-Black.otf", 52), fill=(255, 255, 255, int(255 * p)), anchor="mm")
    d.text((W / 2, 1500), SERIES, font=font("Anton.ttf", 64), fill=(255, 255, 255, int(200 * p)), anchor="mm")
    d.text((W / 2, 1580), "Music: Kevin MacLeod (incompetech.com)", font=font("Inter-SemiBold.otf", 30),
           fill=(200, 200, 210, int(230 * p)), anchor="mm")
    d.text((W / 2, 1625), "Licensed under Creative Commons: By Attribution 4.0", font=font("Inter-SemiBold.otf", 26),
           fill=(170, 170, 185, int(230 * p)), anchor="mm")
    d.text((W / 2, 1668), "Fictional teams & characters · AI voices", font=font("Inter-SemiBold.otf", 26),
           fill=(170, 170, 185, int(230 * p)), anchor="mm")
    if t < 0.3:
        fr.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(200 * (1 - t / 0.3)))))
    return fr.convert("RGB")


def init():
    global BOTTOM_FADE, FLASH
    BOTTOM_FADE = make_bottom_fade()
    FLASH = art.glow((600, 600), (255, 255, 255), 3.0, 0.9)


if __name__ == "__main__":
    eps = [int(x) for x in sys.argv[5:]] or [e["num"] for e in EPISODES]
    with Pool(min(4, len(eps)), initializer=init) as pool:
        for num, total in pool.imap_unordered(render_episode, eps):
            print(f"episode {num} done: {total:.1f}s", flush=True)
