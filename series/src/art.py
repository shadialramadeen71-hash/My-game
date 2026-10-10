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
