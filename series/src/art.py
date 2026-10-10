"""Procedural artwork: characters, scene backgrounds, field drawing."""
import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import numpy as np

W, H = 1080, 1920
FONT_DIR = None  # set by render.py

NAVY = (11, 31, 75)
GOLD = (242, 169, 0)
WOLF = (150, 20, 35)
WHITE = (255, 255, 255)


def font(name, size):
    return ImageFont.truetype(f"{FONT_DIR}/{name}", size)


def grad(w, h, top, bottom, horizontal=False):
    a = np.linspace(0, 1, w if horizontal else h)[None, :, None] if horizontal else np.linspace(0, 1, h)[:, None, None]
    t, b = np.array(top, float), np.array(bottom, float)
    arr = t + (b - t) * a
    arr = np.broadcast_to(arr, (h, w, 3))
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def glow(size, color, radius, strength=1.0):
    """Soft radial light, returned as RGBA."""
    w, h = size
    y, x = np.mgrid[0:h, 0:w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    a = np.clip(1 - d, 0, 1) ** radius * 255 * strength
    img = np.zeros((h, w, 4), np.uint8)
    img[..., :3] = color
    img[..., 3] = np.clip(a, 0, 255)
    return Image.fromarray(img, "RGBA")


def add_light(base, light, pos):
    """Additive blend of an RGBA light onto RGB base."""
    lx, ly = pos
    w, h = light.size
    region = base.crop((lx, ly, lx + w, ly + h))
    la = np.asarray(light, float)
    rgb = la[..., :3] * (la[..., 3:4] / 255)
    out = np.clip(np.asarray(region, float) + rgb, 0, 255).astype(np.uint8)
    base.paste(Image.fromarray(out), (lx, ly))


def vignette(img, strength=0.65):
    w, h = img.size
    y, x = np.mgrid[0:h, 0:w]
    d = np.sqrt(((x - w / 2) / (w / 1.3)) ** 2 + ((y - h / 2) / (h / 1.5)) ** 2)
    m = np.clip(1 - strength * d ** 2, 0.15, 1)[..., None]
    return Image.fromarray((np.asarray(img, float) * m).astype(np.uint8))


# ---------------------------------------------------------------- characters
S = 2  # supersample


def _p(pts):
    return [(x * S, y * S) for x, y in pts]


def _e(box):
    return [v * S for v in box]


def _darken(c, f):
    return tuple(int(v * f) for v in c)


def draw_marcus(mouth=0, blink=False, helmet=False):
    """Rookie QB #7 — 600x900 RGBA."""
    img = Image.new("RGBA", (600 * S, 900 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin, skin_d, skin_l = (120, 74, 42), (88, 52, 28), (160, 104, 64)
    # torso / shoulder pads
    torso = [(20, 900), (35, 690), (90, 610), (215, 572), (385, 572), (510, 610), (565, 690), (580, 900)]
    d.polygon(_p([(x, y - 6) for x, y in torso]), fill=(70, 110, 190))  # rim light
    d.polygon(_p(torso), fill=NAVY)
    # pad caps highlight
    d.polygon(_p([(35, 690), (90, 610), (215, 572), (200, 640), (110, 690), (70, 760)]), fill=(20, 48, 105))
    d.polygon(_p([(565, 690), (510, 610), (385, 572), (400, 640), (490, 690), (530, 760)]), fill=(20, 48, 105))
    # sleeve stripes
    for off in (0, 26):
        d.line(_p([(40 + off * 0.3, 760 + off), (95, 700 + off)]), fill=GOLD, width=10 * S)
        d.line(_p([(560 - off * 0.3, 760 + off), (505, 700 + off)]), fill=GOLD, width=10 * S)
    # collar
    d.polygon(_p([(235, 575), (365, 575), (330, 640), (270, 640)]), fill=GOLD)
    d.polygon(_p([(250, 575), (350, 575), (322, 625), (278, 625)]), fill=NAVY)
    # number
    f = font("Anton.ttf", 210 * S)
    d.text((300 * S, 790 * S), "7", font=f, fill=WHITE, anchor="mm", stroke_width=9 * S, stroke_fill=GOLD)
    # neck
    d.rounded_rectangle(_e([248, 450, 352, 600]), 30 * S, fill=skin)
    d.polygon(_p([(248, 500), (352, 500), (352, 540), (300, 560), (248, 540)]), fill=skin_d)
    # ears
    d.ellipse(_e([186, 330, 226, 405]), fill=skin)
    d.ellipse(_e([374, 330, 414, 405]), fill=skin)
    # head with rim light
    d.ellipse(_e([206, 196, 400, 494]), fill=skin_l)
    d.ellipse(_e([200, 200, 394, 498]), fill=skin)
    # hair (short fade + top)
    d.chord(_e([198, 186, 402, 420]), 180, 360, fill=(22, 16, 14))
    d.rectangle(_e([200, 290, 214, 340]), fill=(22, 16, 14))
    d.rectangle(_e([386, 290, 400, 340]), fill=(22, 16, 14))
    # brows
    d.line(_p([(245, 330), (290, 324)]), fill=(25, 15, 10), width=11 * S)
    d.line(_p([(310, 324), (355, 330)]), fill=(25, 15, 10), width=11 * S)
    # eyes
    if blink:
        d.line(_p([(247, 362), (285, 362)]), fill=(30, 18, 12), width=5 * S)
        d.line(_p([(315, 362), (353, 362)]), fill=(30, 18, 12), width=5 * S)
    else:
        for cx in (266, 334):
            d.ellipse(_e([cx - 21, 350, cx + 21, 375]), fill=(245, 240, 235))
            d.ellipse(_e([cx - 10, 351, cx + 10, 374]), fill=(45, 28, 18))
            d.ellipse(_e([cx - 4, 355, cx + 2, 361]), fill=WHITE)
    # eye black
    d.rounded_rectangle(_e([245, 388, 287, 400]), 4 * S, fill=(15, 15, 15))
    d.rounded_rectangle(_e([313, 388, 355, 400]), 4 * S, fill=(15, 15, 15))
    # nose
    d.polygon(_p([(300, 375), (288, 425), (300, 432), (312, 425)]), fill=skin_d)
    d.ellipse(_e([282, 418, 318, 438]), fill=skin_d)
    # mouth
    if mouth == 0:
        d.line(_p([(275, 458), (300, 462), (325, 458)]), fill=(60, 30, 25), width=6 * S, joint="curve")
    elif mouth == 1:
        d.ellipse(_e([278, 450, 322, 472]), fill=(55, 20, 22))
        d.rectangle(_e([284, 450, 316, 456]), fill=(240, 236, 230))
    else:
        d.ellipse(_e([274, 446, 326, 486]), fill=(55, 20, 22))
        d.rectangle(_e([282, 446, 318, 454]), fill=(240, 236, 230))
        d.ellipse(_e([286, 470, 314, 484]), fill=(170, 70, 70))
    return img.resize((600, 900), Image.LANCZOS)


def draw_coach(mouth=0, blink=False):
    """Head coach Ray Dawson — 600x900 RGBA."""
    img = Image.new("RGBA", (600 * S, 900 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin, skin_d, skin_l = (226, 172, 128), (190, 135, 98), (245, 205, 170)
    jacket, jacket_l = (34, 38, 48), (70, 80, 100)
    beard = (150, 148, 145)
    torso = [(30, 900), (45, 700), (110, 620), (225, 585), (375, 585), (490, 620), (555, 700), (570, 900)]
    d.polygon(_p([(x, y - 6) for x, y in torso]), fill=jacket_l)
    d.polygon(_p(torso), fill=jacket)
    # polo collar + zipper
    d.polygon(_p([(225, 585), (300, 680), (375, 585), (345, 575), (300, 630), (255, 575)]), fill=GOLD)
    d.line(_p([(300, 680), (300, 900)]), fill=(90, 95, 110), width=5 * S)
    # team patch
    d.ellipse(_e([395, 690, 465, 760]), fill=NAVY, outline=GOLD, width=5 * S)
    d.text((430 * S, 726 * S), "S", font=font("Anton.ttf", 48 * S), fill=GOLD, anchor="mm")
    # whistle lanyard
    d.line(_p([(250, 600), (230, 780)]), fill=(200, 30, 40), width=6 * S)
    d.line(_p([(350, 600), (240, 780)]), fill=(200, 30, 40), width=6 * S)
    d.rounded_rectangle(_e([214, 772, 262, 800]), 8 * S, fill=(190, 190, 195))
    # neck
    d.rounded_rectangle(_e([250, 460, 350, 600]), 30 * S, fill=skin_d)
    # ears
    d.ellipse(_e([184, 335, 226, 410]), fill=skin)
    d.ellipse(_e([374, 335, 416, 410]), fill=skin)
    # head
    d.ellipse(_e([206, 206, 400, 500]), fill=skin_l)
    d.ellipse(_e([200, 210, 394, 504]), fill=skin)
    # beard
    d.chord(_e([200, 300, 400, 512]), 0, 180, fill=beard)
    d.polygon(_p([(204, 380), (230, 380), (240, 420), (204, 410)]), fill=beard)
    d.polygon(_p([(396, 380), (370, 380), (360, 420), (396, 410)]), fill=beard)
    # moustache
    d.chord(_e([262, 425, 338, 458]), 180, 360, fill=(120, 118, 115))
    # wrinkles
    d.arc(_e([236, 362, 270, 392]), 200, 250, fill=skin_d, width=3 * S)
    d.arc(_e([330, 362, 364, 392]), 290, 340, fill=skin_d, width=3 * S)
    # brows (grey, stern)
    d.line(_p([(244, 336), (290, 344)]), fill=(110, 108, 104), width=12 * S)
    d.line(_p([(310, 344), (356, 336)]), fill=(110, 108, 104), width=12 * S)
    if blink:
        d.line(_p([(248, 365), (284, 365)]), fill=(70, 45, 35), width=5 * S)
        d.line(_p([(316, 365), (352, 365)]), fill=(70, 45, 35), width=5 * S)
    else:
        for cx in (266, 334):
            d.ellipse(_e([cx - 19, 355, cx + 19, 376]), fill=(240, 238, 232))
            d.ellipse(_e([cx - 9, 356, cx + 9, 375]), fill=(60, 80, 100))
            d.ellipse(_e([cx - 4, 359, cx + 1, 364]), fill=WHITE)
            d.line(_p([(cx - 20, 355), (cx + 20, 355)]), fill=skin_d, width=4 * S)
    # nose
    d.polygon(_p([(300, 372), (286, 420), (300, 428), (314, 420)]), fill=skin_d)
    # mouth inside the beard
    if mouth == 0:
        d.line(_p([(278, 462), (322, 462)]), fill=(80, 40, 35), width=6 * S)
    elif mouth == 1:
        d.ellipse(_e([280, 452, 320, 474]), fill=(60, 22, 22))
    else:
        d.ellipse(_e([276, 448, 324, 490]), fill=(60, 22, 22))
        d.rectangle(_e([284, 448, 316, 456]), fill=(235, 230, 220))
    # cap
    d.chord(_e([192, 168, 408, 380]), 180, 360, fill=NAVY)
    d.chord(_e([192, 168, 408, 380]), 200, 250, fill=(30, 55, 110))
    d.rectangle(_e([192, 268, 408, 290]), fill=(8, 22, 55))
    d.chord(_e([170, 262, 430, 318]), 0, 180, fill=(8, 22, 55))
    d.text((300 * S, 222 * S), "S", font=font("Anton.ttf", 70 * S), fill=GOLD, anchor="mm")
    # headset: band, ear cup, mic boom
    d.arc(_e([176, 170, 424, 420]), 185, 355, fill=(25, 25, 28), width=12 * S)
    d.ellipse(_e([168, 320, 228, 410]), fill=(25, 25, 28))
    d.ellipse(_e([180, 334, 216, 396]), fill=(60, 60, 66))
    d.line(_p([(200, 400), (230, 470), (272, 482)]), fill=(25, 25, 28), width=7 * S, joint="curve")
    d.ellipse(_e([264, 472, 288, 494]), fill=(25, 25, 28))
    return img.resize((600, 900), Image.LANCZOS)


def character_set(kind):
    fn = draw_marcus if kind == "MARCUS" else draw_coach
    out = {}
    for m in (0, 1, 2):
        for b in (False, True):
            out[(m, b)] = fn(mouth=m, blink=b)
    return out


# ---------------------------------------------------------------- backgrounds

def stars(img, n, area, seed=1):
    rnd = random.Random(seed)
    d = ImageDraw.Draw(img)
    for _ in range(n):
        x, y = rnd.randint(area[0], area[2]), rnd.randint(area[1], area[3])
        c = rnd.randint(120, 255)
        d.point((x, y), fill=(c, c, c))


def crowd_band(img, y0, y1, seed, density=0.55, palette=None):
    """Stands full of fans as colored specks."""
    rnd = np.random.default_rng(seed)
    w = img.size[0]
    h = y1 - y0
    arr = np.asarray(img).copy()
    palette = palette or [NAVY, GOLD, (200, 200, 200), (60, 60, 70), (30, 60, 140), (230, 180, 40)]
    pal = np.array(palette)
    for row in range(0, h, 7):
        ys = y0 + row
        xs = np.arange(rnd.integers(0, 6), w, 7)
        keep = rnd.random(len(xs)) < density
        cols = pal[rnd.integers(0, len(pal), len(xs))]
        shade = 0.35 + 0.65 * (row / max(h, 1))
        for x, c, k in zip(xs, cols, keep):
            if k:
                arr[ys:ys + 4, x:x + 4] = (c * shade * rnd.uniform(0.6, 1.0)).astype(np.uint8)
    return Image.fromarray(arr)


def field_points(u, v, cfg):
    """Map field (u across 0..1, v depth 0 near..1 far) to screen."""
    ynear, yfar, wnear, wfar, cx = cfg
    v = min(max(v, -0.3), 1.3)
    vv = 1.9 * v / (1.9 * v + (1 - v)) if 0 <= v < 1 else (v if v < 0 else 1 + (v - 1) * 0.3)
    y = ynear + (yfar - ynear) * vv
    wid = wnear + (wfar - wnear) * vv
    return cx + (u - 0.5) * wid, y


def project(x, Y, cam):
    """Field coords (x yards across 0..53.3, Y absolute yard line) -> screen (x, y, scale)."""
    cfg, y0, depth = cam
    v = (Y - y0) / depth
    sx, sy = field_points(x / 53.3, v, cfg)
    ynear, yfar, wnear, wfar, cx = cfg
    vv = (sy - ynear) / (yfar - ynear)
    scale = (wnear + (wfar - wnear) * vv) / wnear
    return sx, sy, scale


def draw_field(img, cfg, yard_start=0, depth_yards=30, numbers=True, ez_text="STALLIONS"):
    """Draw a perspective field from absolute yard yard_start (near) to yard_start+depth (far).
    Yards < 0 and >= 100 are end zones."""
    d = ImageDraw.Draw(img)
    cam = (cfg, yard_start, depth_yards)
    P = lambda x, Y: project(x, Y, cam)[:2]
    lo = math.floor(yard_start / 5) * 5
    hi = yard_start + depth_yards
    d.polygon([P(-30, yard_start), P(83, yard_start), P(83, hi), P(-30, hi)], fill=(22, 84, 42))
    y = lo
    while y < hi:
        a, b = max(y, yard_start), min(y + 5, hi)
        if y >= 110 or y < -10:
            col = (16, 40, 30)
        elif y < 0 or y >= 100:
            col = NAVY
        else:
            col = (34, 120, 52) if (y // 5) % 2 == 0 else (40, 134, 60)
        d.polygon([P(-2, a), P(55.3, a), P(55.3, b), P(-2, b)], fill=col)
        y += 5
    for yd in range(lo, int(hi) + 1, 5):
        if yd < yard_start or yd < -10 or yd > 110:
            continue
        sc = project(26, yd, cam)[2]
        lw = max(1, int(6 * sc))
        if 0 <= yd <= 100:
            d.line([P(0.5, yd), P(52.8, yd)], fill=(235, 240, 235), width=lw + (3 if yd in (0, 100) else 0))
        if yd in (-10, 110):
            d.line([P(0.5, yd), P(52.8, yd)], fill=(235, 240, 235), width=lw)
        for x in (0.8, 20.4, 32.9, 52.5):
            for sub in range(1, 5):
                Y = yd + sub
                if 0 < Y < 100 and Y <= hi:
                    p = P(x, Y)
                    s2 = 9 * project(x, Y, cam)[2]
                    d.line([(p[0] - s2, p[1]), (p[0] + s2, p[1])], fill=(225, 230, 225), width=max(1, lw - 1))
        if numbers and yd % 10 == 0 and 0 < yd < 100:
            n = yd if yd <= 50 else 100 - yd
            for x in (9, 44.3):
                px, py, sc2 = project(x, yd, cam)
                sz = int(64 * sc2)
                if sz > 8:
                    d.text((px, py), str(n), font=font("Anton.ttf", sz), fill=(235, 240, 235), anchor="mm")
    d.line([P(0.5, max(yard_start, -10)), P(0.5, min(hi, 110))], fill=WHITE, width=5)
    d.line([P(52.8, max(yard_start, -10)), P(52.8, min(hi, 110))], fill=WHITE, width=5)
    for ez, yy in ((-5, -5), (105, 105)):
        if yard_start <= yy <= hi:
            px, py, sc2 = project(26.65, yy, cam)
            d.text((px, py), ez_text, font=font("Anton.ttf", max(int(110 * sc2), 10)), fill=GOLD, anchor="mm")


def bg_stadium(seed=3, blur=0):
    """Night stadium; returned larger than frame for camera moves."""
    BW, BH = 1240, 2100
    img = grad(BW, BH, (4, 8, 26), (18, 30, 70))
    stars(img, 260, (0, 0, BW, 500), seed)
    # upper deck + crowd
    d = ImageDraw.Draw(img)
    d.polygon([(0, 560), (BW, 520), (BW, 900), (0, 940)], fill=(20, 24, 40))
    img = crowd_band(img, 580, 880, seed)
    d = ImageDraw.Draw(img)
    # ribbon board
    d.rectangle((0, 880, BW, 930), fill=(10, 10, 16))
    for x in range(0, BW, 300):
        d.text((x + 150, 905), "STALLIONS", font=font("Anton.ttf", 34), fill=GOLD, anchor="mm")
    img = crowd_band(img, 930, 1080, seed + 1, density=0.7)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 1080, BW, 1110), fill=(14, 40, 30))
    # field
    cfg = (BH + 200, 1110, 3000, 1450, BW / 2)
    draw_field(img, cfg, yard_start=60, depth_yards=40)
    # light towers
    for tx in (90, BW - 90):
        d.line([(tx, 520), (tx, 230)], fill=(30, 34, 50), width=14)
        d.rectangle((tx - 80, 170, tx + 80, 240), fill=(40, 44, 60))
        for i in range(4):
            for j in range(2):
                d.ellipse((tx - 72 + i * 38, 176 + j * 32, tx - 44 + i * 38, 202 + j * 32), fill=(255, 250, 225))
        add_light(img, glow((700, 700), (255, 240, 200), 2.2, 0.85), (tx - 350, 205 - 350))
    add_light(img, glow((BW, 900), (120, 150, 255), 2.5, 0.25), (0, 300))
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    return vignette(img, 0.5)


def bg_locker(seed=5):
    BW, BH = 1240, 2100
    img = grad(BW, BH, (14, 20, 34), (26, 30, 44))
    d = ImageDraw.Draw(img)
    # lockers
    lw = 200
    for i in range(7):
        x0 = -40 + i * (lw + 12)
        d.rectangle((x0, 260, x0 + lw, 1500), fill=(36, 46, 70))
        d.rectangle((x0 + 8, 268, x0 + lw - 8, 1492), fill=(28, 36, 58))
        d.rectangle((x0 + 20, 300, x0 + lw - 20, 340), fill=(200, 160, 40))
        nums = [12, 88, 7, 24, 54, 33, 81]
        d.text((x0 + lw / 2, 320), f"#{nums[i]}", font=font("Anton.ttf", 30), fill=NAVY, anchor="mm")
        # hanging jersey
        jx = x0 + lw / 2
        col = NAVY if i % 2 else (230, 230, 235)
        d.polygon([(jx - 70, 420), (jx + 70, 420), (jx + 92, 470), (jx + 66, 488), (jx + 60, 700),
                   (jx - 60, 700), (jx - 66, 488), (jx - 92, 470)], fill=col)
        d.text((jx, 560), str(nums[i]), font=font("Anton.ttf", 80), fill=GOLD, anchor="mm")
        # helmet on shelf
        d.chord((jx - 55, 760, jx + 55, 860), 180, 360, fill=(20, 30, 60))
        d.rectangle((jx - 55, 808, jx + 55, 818), fill=GOLD)
        for v in range(10):
            d.line([(x0 + 40, 1000 + v * 18), (x0 + lw - 40, 1000 + v * 18)], fill=(20, 26, 44), width=6)
    # bench
    d.rectangle((0, 1520, BW, 1580), fill=(120, 80, 40))
    d.rectangle((0, 1580, BW, 1600), fill=(70, 46, 24))
    # floor
    floor = grad(BW, BH - 1600, (40, 40, 50), (14, 14, 20))
    img.paste(floor, (0, 1600))
    for cx in (300, 940):
        add_light(img, glow((700, 1400), (255, 220, 160), 1.6, 0.35), (cx - 350, 0))
    return vignette(img, 0.7)


def bg_film(seed=7):
    BW, BH = 1240, 2100
    img = grad(BW, BH, (8, 10, 16), (16, 18, 26))
    d = ImageDraw.Draw(img)
    # screen frame
    d.rectangle((100, 230, BW - 100, 980), fill=(4, 4, 6))
    # seats
    for row in range(3):
        y = 1560 + row * 160
        for i in range(-1, 7):
            x = i * 190 + (row % 2) * 90
            d.rounded_rectangle((x, y, x + 160, y + 120), 30, fill=(28, 22, 26))
            d.rounded_rectangle((x + 10, y - 60, x + 150, y + 20), 26, fill=(36, 28, 34))
    add_light(img, glow((1300, 900), (90, 140, 255), 1.4, 0.35), (-30, 160))
    return vignette(img, 0.6)


SCREEN = (130, 260, 1110, 950)  # inside bg_film coordinates (before crop offset)


def bg_play_top(seed=11):
    """Upper part of the broadcast play view (stands)."""
    img = grad(W, 560, (6, 10, 30), (20, 28, 60))
    stars(img, 80, (0, 0, W, 120), seed)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 130, W, 560), fill=(20, 24, 40))
    img = crowd_band(img, 140, 470, seed, density=0.65)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 470, W, 520), fill=(10, 10, 16))
    for x in range(0, W, 270):
        d.text((x + 135, 495), "STALLIONS  ", font=font("Anton.ttf", 32), fill=GOLD, anchor="mm")
    d.rectangle((0, 520, W, 560), fill=(18, 50, 34))
    add_light(img, glow((W, 500), (140, 160, 255), 2.0, 0.3), (0, 0))
    return img

PLAY_CFG = (2150, 560, 1700, 700, W / 2)


# ---------------------------------------------------------------- extra locations

def _clouds(img, n, area, color, seed, blur=18):
    rnd = random.Random(seed)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        cx, cy = rnd.uniform(area[0], area[2]), rnd.uniform(area[1], area[3])
        for k in range(5):
            w, h = rnd.uniform(90, 200), rnd.uniform(40, 80)
            ox = rnd.uniform(-140, 140)
            d.ellipse((cx + ox - w, cy - h + rnd.uniform(-20, 20), cx + ox + w, cy + h), fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    img = img.convert("RGBA")
    img.alpha_composite(layer)
    return img.convert("RGB")


def bg_office(seed=21):
    """Coach's office at night: city window, trophies, desk lamp."""
    BW, BH = 1240, 2100
    img = grad(BW, BH, (52, 34, 24), (26, 16, 12))
    d = ImageDraw.Draw(img)
    for x in range(0, BW, 110):  # wood panels
        d.line([(x, 0), (x, BH)], fill=(38, 24, 16), width=4)
    # window with city skyline
    wx0, wy0, wx1, wy1 = 170, 230, 1070, 930
    sky = grad(wx1 - wx0, wy1 - wy0, (8, 12, 34), (40, 30, 70))
    img.paste(sky, (wx0, wy0))
    rnd = random.Random(seed)
    x = wx0
    while x < wx1:
        bw = rnd.randint(50, 120)
        bh = rnd.randint(120, 460)
        top = wy1 - bh
        d.rectangle((x, top, x + bw, wy1), fill=(14, 16, 28))
        for yy in range(top + 12, wy1 - 10, 22):
            for xx in range(x + 8, x + bw - 8, 16):
                if rnd.random() < 0.35:
                    d.rectangle((xx, yy, xx + 7, yy + 10), fill=(255, 210, 120) if rnd.random() < 0.8 else (160, 200, 255))
        x += bw + rnd.randint(2, 10)
    # distant stadium glow in the window
    add_light(img, glow((520, 260), (200, 220, 255), 1.8, 0.55), (560, 640))
    d = ImageDraw.Draw(img)
    for xx in (wx0, (wx0 + wx1) // 2, wx1):
        d.rectangle((xx - 10, wy0, xx + 10, wy1), fill=(20, 14, 10))
    d.rectangle((wx0 - 10, wy0 - 10, wx1 + 10, wy0 + 10), fill=(20, 14, 10))
    d.rectangle((wx0 - 10, wy1 - 10, wx1 + 10, wy1 + 20), fill=(20, 14, 10))
    # trophy shelf
    d.rectangle((60, 1020, 1180, 1040), fill=(80, 52, 30))
    for i, x in enumerate(range(120, 1180, 150)):
        h = 90 + (i % 3) * 25
        d.polygon([(x - 30, 1020 - h), (x + 30, 1020 - h), (x + 18, 1020 - h + 55), (x - 18, 1020 - h + 55)], fill=GOLD)
        d.rectangle((x - 6, 1020 - h + 55, x + 6, 1000), fill=(200, 140, 0))
        d.rectangle((x - 26, 1000, x + 26, 1020), fill=(40, 30, 24))
    # framed photo + whiteboard edge
    d.rectangle((40, 300, 140, 420), fill=(200, 190, 170), outline=(20, 14, 10), width=8)
    # desk
    d.rectangle((0, 1560, BW, 1640), fill=(70, 42, 24))
    d.rectangle((0, 1640, BW, BH), fill=(38, 22, 12))
    add_light(img, glow((900, 900), (255, 200, 120), 1.5, 0.35), (-250, 900))
    return vignette(img, 0.6)


def bg_practice(sunset=False, seed=23):
    BW, BH = 1240, 2100
    if sunset:
        img = grad(BW, 1080, (60, 40, 110), (250, 140, 70))
    else:
        img = grad(BW, 1080, (60, 130, 220), (170, 210, 245))
    big = Image.new("RGB", (BW, BH))
    big.paste(img, (0, 0))
    img = big
    if sunset:
        add_light(img, glow((900, 600), (255, 200, 120), 1.4, 0.9), (170, 700))
        d = ImageDraw.Draw(img)
        d.ellipse((560, 930, 680, 1050), fill=(255, 220, 150))
        img = _clouds(img, 6, (0, 200, BW, 700), (255, 150, 120, 150), seed)
    else:
        add_light(img, glow((700, 700), (255, 255, 220), 1.6, 0.8), (700, -150))
        img = _clouds(img, 7, (0, 150, BW, 650), (255, 255, 255, 210), seed)
    d = ImageDraw.Draw(img)
    # tree line + bleachers
    rnd = random.Random(seed)
    for x in range(-40, BW + 40, 46):
        r = rnd.randint(40, 75)
        d.ellipse((x - r, 1020 - r, x + r, 1060 + r // 2), fill=(30, 60, 36) if not sunset else (40, 30, 40))
    for side in (0, 1):
        x0 = 0 if side == 0 else BW - 380
        for k in range(6):
            d.rectangle((x0, 1000 + k * 14, x0 + 380, 1006 + k * 14), fill=(190, 195, 205) if not sunset else (120, 100, 110))
    d.rectangle((0, 1080, BW, 1100), fill=(20, 70, 36))
    cfg = (BH + 200, 1100, 3000, 1450, BW / 2)
    draw_field(img, cfg, yard_start=70, depth_yards=40)
    d = ImageDraw.Draw(img)
    # goal post at far end
    gx, gy = BW / 2, 1105
    d.line([(gx, gy), (gx, gy - 120)], fill=(255, 210, 40), width=10)
    d.line([(gx - 170, gy - 120), (gx + 170, gy - 120)], fill=(255, 210, 40), width=10)
    d.line([(gx - 170, gy - 120), (gx - 170, gy - 380)], fill=(255, 210, 40), width=8)
    d.line([(gx + 170, gy - 120), (gx + 170, gy - 380)], fill=(255, 210, 40), width=8)
    # tackling dummies
    for x, y, s in ((180, 1240, 1.0), (1040, 1230, 1.0), (330, 1150, 0.7), (900, 1150, 0.7)):
        d.rounded_rectangle((x - 40 * s, y - 170 * s, x + 40 * s, y), int(30 * s), fill=(190, 30, 40))
        d.rectangle((x - 40 * s, y - 110 * s, x + 40 * s, y - 90 * s), fill=GOLD)
    if sunset:
        tint = Image.new("RGB", img.size, (255, 120, 60))
        img = Image.blend(img, tint, 0.18)
    return vignette(img, 0.45)


def bg_tunnel(seed=25):
    """Stadium tunnel looking out at the bright field."""
    BW, BH = 1240, 2100
    img = Image.new("RGB", (BW, BH), (12, 13, 18))
    d = ImageDraw.Draw(img)
    vx, vy = BW / 2, 760
    for k in range(18, 0, -1):
        f = k / 18
        w, h = 120 + 1300 * f ** 1.6, 160 + 1900 * f ** 1.6
        c = int(14 + 60 * (1 - f))
        d.rounded_rectangle((vx - w / 2, vy - h * 0.42, vx + w / 2, vy + h * 0.58), int(w * 0.25),
                            fill=(c, c + 2, c + 10))
        # ceiling light strips
        if k % 3 == 0:
            d.rectangle((vx - w * 0.18, vy - h * 0.42 + 8, vx + w * 0.18, vy - h * 0.42 + 8 + 10 * f), fill=(230, 235, 255))
    # opening
    d.rounded_rectangle((vx - 120, vy - 140, vx + 120, vy + 150), 40, fill=(235, 245, 230))
    d.rectangle((vx - 120, vy + 60, vx + 120, vy + 150), fill=(110, 200, 120))
    add_light(img, glow((1100, 1100), (255, 255, 230), 1.3, 0.9), (int(vx - 550), int(vy - 550)))
    d = ImageDraw.Draw(img)
    # team banners on the walls
    for side in (-1, 1):
        x = vx + side * 420
        d.polygon([(x - 70, 380), (x + 70, 380), (x + 70, 900), (x, 960), (x - 70, 900)], fill=NAVY)
        d.text((x, 520), "S", font=font("Anton.ttf", 150), fill=GOLD, anchor="mm")
        d.text((x, 760), "WIN\nTHE\nDAY", font=font("Anton.ttf", 50), fill=WHITE, anchor="mm", align="center")
    # floor with logo
    d.polygon([(0, BH), (BW, BH), (vx + 160, vy + 150), (vx - 160, vy + 150)], fill=(24, 26, 34))
    d.ellipse((vx - 330, 1600, vx + 330, 1820), outline=GOLD, width=8)
    return vignette(img, 0.55)


def bg_press(seed=27):
    """Post-game press conference backdrop."""
    BW, BH = 1240, 2100
    img = grad(BW, BH, (235, 238, 245), (200, 205, 215))
    d = ImageDraw.Draw(img)
    fA, fB = font("Anton.ttf", 64), font("Anton.ttf", 52)
    for r, y in enumerate(range(160, 1500, 150)):
        for c, x in enumerate(range(-100, BW + 200, 300)):
            xx = x + (150 if r % 2 else 0)
            if (r + c) % 2 == 0:
                d.text((xx, y), "STALLIONS", font=fA, fill=NAVY, anchor="mm")
            else:
                d.ellipse((xx - 45, y - 45, xx + 45, y + 45), fill=NAVY)
                d.text((xx, y), "S", font=fB, fill=GOLD, anchor="mm")
    add_light(img, glow((1240, 1000), (255, 255, 255), 2.0, 0.25), (0, 300))
    return vignette(img, 0.5)


def bg_bench(seed=29):
    """Sideline bench in the 4th quarter: blurred stadium, cooler, bench, heater."""
    img = bg_stadium(seed=seed, blur=9)
    img = ImageEnhance_brightness(img, 0.75)
    d = ImageDraw.Draw(img)
    BW = img.size[0]
    # long team bench
    d.rectangle((0, 1250, BW, 1300), fill=(20, 40, 100))
    d.rectangle((0, 1300, BW, 1330), fill=(12, 24, 60))
    for x in range(60, BW, 260):
        d.rectangle((x, 1330, x + 16, 1520), fill=(70, 70, 80))
    # cooler with cups (left) and heater (right)
    d.rounded_rectangle((20, 1080, 230, 1300), 24, fill=GOLD)
    d.rectangle((20, 1150, 230, 1170), fill=(200, 130, 0))
    d.rounded_rectangle((70, 1040, 180, 1090), 10, fill=WHITE)
    for k in range(5):
        d.polygon([(250 + k * 34, 1300), (276 + k * 34, 1300), (272 + k * 34, 1260), (254 + k * 34, 1260)], fill=(240, 240, 240))
    d.rounded_rectangle((1000, 1020, 1210, 1300), 20, fill=(60, 62, 70))
    for k in range(6):
        d.line([(1020, 1060 + k * 36), (1190, 1060 + k * 36)], fill=(255, 120, 40), width=8)
    add_light(img, glow((500, 500), (255, 120, 40), 1.8, 0.45), (850, 900))
    return img


def ImageEnhance_brightness(img, f):
    from PIL import ImageEnhance
    return ImageEnhance.Brightness(img).enhance(f)


def bg_home(seed=31):
    """Reed family living room."""
    BW, BH = 1240, 2100
    img = grad(BW, BH, (214, 180, 140), (170, 130, 95))
    d = ImageDraw.Draw(img)
    # wallpaper stripes
    for x in range(0, BW, 80):
        d.rectangle((x, 0, x + 36, 1300), fill=(205, 170, 130))
    # window with evening sky
    wx0, wy0, wx1, wy1 = 700, 300, 1120, 820
    img.paste(grad(wx1 - wx0, wy1 - wy0, (40, 50, 110), (240, 140, 90)), (wx0, wy0))
    d = ImageDraw.Draw(img)
    d.rectangle((wx0 - 14, wy0 - 14, wx1 + 14, wy1 + 14), outline=(250, 245, 235), width=18)
    d.line([((wx0 + wx1) / 2, wy0), ((wx0 + wx1) / 2, wy1)], fill=(250, 245, 235), width=12)
    d.rectangle((wx0 - 60, wy0 - 40, wx0 + 40, wy1 + 60), fill=(160, 40, 50))  # curtains
    d.rectangle((wx1 - 40, wy0 - 40, wx1 + 60, wy1 + 60), fill=(160, 40, 50))
    # family photo frames
    frames = [(110, 330, 260, 500), (300, 300, 420, 450), (130, 560, 300, 700), (340, 520, 520, 760)]
    for i, (a, b, c, e) in enumerate(frames):
        d.rectangle((a, b, c, e), fill=(60, 40, 30))
        d.rectangle((a + 12, b + 12, c - 12, e - 12), fill=[(120, 170, 220), (240, 200, 120), (140, 200, 140), (230, 160, 160)][i])
        cx, cy = (a + c) / 2, (b + e) / 2 + 10
        d.ellipse((cx - 22, cy - 40, cx + 22, cy + 4), fill=(110, 70, 40))
        d.rounded_rectangle((cx - 34, cy + 6, cx + 34, e - 14), 12, fill=NAVY if i % 2 == 0 else GOLD)
    d.text((430, 860), "HOME OF #7", font=font("Anton.ttf", 60), fill=NAVY, anchor="mm")
    # big couch behind characters
    d.rounded_rectangle((-40, 1080, 1280, 1420), 60, fill=(80, 110, 150))
    d.rounded_rectangle((-40, 1220, 1280, 1500), 40, fill=(66, 92, 130))
    for x in (160, 520, 880):
        d.rounded_rectangle((x - 20, 1110, x + 200, 1260), 40, fill=(95, 125, 165))
    # floor + rug
    d.rectangle((0, 1500, BW, BH), fill=(120, 80, 50))
    for y in range(1500, BH, 46):
        d.line([(0, y), (BW, y)], fill=(105, 68, 42), width=4)
    d.ellipse((60, 1650, 1180, 1980), fill=(190, 60, 60))
    d.ellipse((140, 1690, 1100, 1940), outline=GOLD, width=10)
    add_light(img, glow((800, 800), (255, 220, 160), 1.6, 0.35), (-200, 700))
    return vignette(img, 0.5)


def bg_stands(seed=33):
    """Family seats in the stands; field glows below/behind."""
    BW, BH = 1240, 2100
    img = grad(BW, BH, (6, 10, 30), (16, 22, 50))
    d = ImageDraw.Draw(img)
    # field far below, seen over the rail
    d.rectangle((0, 520, BW, 900), fill=(34, 120, 52))
    for k in range(9):
        d.line([(0, 540 + k * 42), (BW, 540 + k * 42)], fill=(230, 235, 230), width=3)
    add_light(img, glow((1400, 700), (200, 220, 255), 1.5, 0.35), (-80, 300))
    for tx in (100, BW - 100):
        d.rectangle((tx - 70, 120, tx + 70, 180), fill=(40, 44, 60))
        add_light(img, glow((500, 500), (255, 240, 200), 2.2, 0.8), (tx - 250, -100))
    img = img.filter(ImageFilter.GaussianBlur(5))
    # fans in rows behind the family
    img = crowd_band(img, 900, 1300, seed, density=0.85)
    img = img.filter(ImageFilter.GaussianBlur(2))
    d = ImageDraw.Draw(img)
    rnd = random.Random(seed)
    for row in range(2):
        y = 960 + row * 170
        for i in range(-1, 10):
            x = i * 140 + (row % 2) * 70 + rnd.randint(-10, 10)
            col = rnd.choice([NAVY, GOLD, (200, 200, 205), (40, 60, 140)])
            d.ellipse((x - 34, y - 70, x + 34, y), fill=_darken(rnd.choice([(110, 70, 40), (230, 180, 140), (160, 110, 70)]), 0.5))
            d.rounded_rectangle((x - 60, y, x + 60, y + 170), 30, fill=_darken(col, 0.55))
    d.rectangle((0, 1300, BW, BH), fill=(30, 34, 50))
    return vignette(img, 0.5)


def fg_stands():
    """Foreground seat backs and railing that hide the family's legs."""
    im = Image.new("RGBA", (W, 520), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 120, W, 520), fill=(22, 26, 40, 255))
    for i in range(-1, 9):
        x = i * 150 + 40
        d.rounded_rectangle((x, 40, x + 130, 260), 26, fill=(20, 40, 100, 255))
        d.rounded_rectangle((x + 10, 50, x + 120, 120), 20, fill=(30, 56, 130, 255))
    d.rectangle((0, 250, W, 270), fill=(170, 175, 185, 255))
    for x in range(0, W, 120):
        d.rectangle((x, 270, x + 12, 520), fill=(140, 145, 155, 255))
    d.rectangle((0, 380, W, 520), fill=(14, 16, 24, 255))
    d.text((W / 2, 450), "SECTION 107  ·  ROW F", font=font("Inter-Black.otf", 34), fill=(120, 130, 160, 255), anchor="mm")
    return im


def fg_press():
    """Press-conference table in the foreground."""
    im = Image.new("RGBA", (W, 560), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, x in enumerate(range(180, 960, 85)):
        h = 120 + (i % 3) * 35
        d.line([(x, 200), (x + (i % 2) * 20 - 10, 200 - h)], fill=(30, 30, 30, 255), width=8)
        d.rounded_rectangle((x - 22, 200 - h - 40, x + 22, 200 - h + 10), 16,
                            fill=[(200, 30, 40), (30, 30, 30), (30, 80, 200), (240, 240, 240)][i % 4] + (255,))
    d.rectangle((0, 200, W, 560), fill=(16, 22, 44, 255))
    d.rectangle((0, 200, W, 222), fill=GOLD + (255,))
    d.text((W / 2, 330), "STALLIONS", font=font("Anton.ttf", 90), fill=GOLD + (255,), anchor="mm")
    return im
