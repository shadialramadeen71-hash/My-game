"""Side-view cars and scrolling road backgrounds for driving scenes."""
import math, random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

import art
from art import W, H, NAVY, GOLD, WHITE, font, grad, glow, add_light

S = 2
ROAD_Y = 1585      # tyre contact line on screen


def _P(pts, ox=0, oy=0):
    return [((x + ox) * S, (y + oy) * S) for x, y in pts]


# Car geometry in a 1000x640 canvas (facing right). Windows listed rear -> front.
CARS = {
    "minivan": dict(
        body=[(40, 525), (36, 300), (70, 215), (130, 190), (600, 186), (680, 205), (800, 330), (915, 365),
              (958, 400), (965, 525)],
        windows=[[(92, 236), (300, 228), (300, 372), (80, 372)],
                 [(322, 226), (548, 224), (548, 372), (322, 372)],
                 [(570, 224), (655, 226), (770, 360), (570, 372)]],
        wheels=[(225, 525), (770, 525)], r=86, color=(170, 32, 44), trim=(120, 20, 30),
        seats=[(195, 318), (435, 312), (618, 312)]),
    "coupe": dict(
        body=[(30, 520), (34, 360), (110, 315), (300, 250), (560, 245), (700, 330), (900, 368), (958, 410),
              (962, 520)],
        windows=[[(300, 270), (548, 266), (548, 360), (196, 360)],
                 [(565, 266), (600, 268), (680, 345), (565, 352)]],
        wheels=[(210, 520), (770, 520)], r=82, color=(16, 34, 84), trim=(8, 18, 46),
        seats=[(430, 322)]),
}


def _car_layers(kind):
    c = CARS[kind]
    cw, ch = 1000, 640
    body = Image.new("RGBA", (cw * S, ch * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.polygon(_P(c["body"]), fill=c["color"])
    # shading: lower panel darker, highlight line along the shoulder
    d.polygon(_P([(c["body"][0][0], 440), (c["body"][-1][0], 440), (c["body"][-1][0], 525), (c["body"][0][0], 525)]),
              fill=c["trim"])
    d.line(_P([(60, 395), (930, 395)]), fill=tuple(min(255, v + 70) for v in c["color"]), width=5 * S)
    # wheel arches
    for (wx, wy) in c["wheels"]:
        r = c["r"] + 16
        d.pieslice(((wx - r) * S, (wy - r) * S, (wx + r) * S, (wy + r) * S), 180, 360, fill=(18, 18, 22))
    # doors, handles, mirror, lights
    for x in ([310, 560] if kind == "minivan" else [555]):
        d.line(_P([(x, 228), (x, 500)]), fill=c["trim"], width=4 * S)
    for x in ([420, 640] if kind == "minivan" else [470]):
        d.rounded_rectangle(((x - 26) * S, 410 * S, (x + 26) * S, 424 * S), 6 * S, fill=(220, 220, 225))
    d.polygon(_P([(690, 300), (735, 296), (740, 330), (700, 334)]), fill=c["trim"])
    d.rounded_rectangle((920 * S, 395 * S, 962 * S, 430 * S), 8 * S, fill=(255, 245, 210))
    d.rounded_rectangle((32 * S, 350 * S, 52 * S, 420 * S), 6 * S, fill=(230, 30, 40))
    if kind == "coupe":
        d.polygon(_P([(100, 470), (950, 455), (950, 475), (100, 490)]), fill=GOLD)
        d.text((330 * S, 465 * S), "7", font=font("Anton.ttf", 60 * S), fill=GOLD, anchor="mm")
    else:
        d.rounded_rectangle((60 * S, 455 * S, 230 * S, 495 * S), 8 * S, fill=WHITE)
        d.text((145 * S, 475 * S), "#7 FAN CLUB", font=font("Inter-Black.otf", 20 * S), fill=NAVY, anchor="mm")
        d.rectangle((150 * S, 172 * S, 560 * S, 184 * S), fill=(60, 60, 66))  # roof rack
    interior = Image.new("RGBA", (cw * S, ch * S), (0, 0, 0, 0))
    di = ImageDraw.Draw(interior)
    glass = Image.new("RGBA", (cw * S, ch * S), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glass)
    for wpoly in c["windows"]:
        d.polygon(_P(wpoly), fill=(0, 0, 0, 0))
        di.polygon(_P(wpoly), fill=(28, 30, 40, 255))
        dg.polygon(_P(wpoly), fill=(160, 200, 235, 55))
        x0 = min(p[0] for p in wpoly)
        dg.polygon(_P([(x0 + 30, 372), (x0 + 70, 372), (x0 + 150, 228), (x0 + 110, 228)]), fill=(255, 255, 255, 40))
        d.line(_P(wpoly + [wpoly[0]]), fill=(20, 20, 24), width=6 * S)
    # steering wheel visible through the front window (minivan) / only window (coupe)
    sx, sy = (700, 360) if kind == "minivan" else (560, 352)
    di.ellipse(((sx - 34) * S, (sy - 44) * S, (sx + 4) * S, (sy + 34) * S), outline=(10, 10, 12), width=8 * S)
    out = {}
    for k, im in (("body", body), ("interior", interior), ("glass", glass)):
        out[k] = im.resize((cw, ch), Image.LANCZOS)
    return out


def wheel_image(r):
    im = Image.new("RGBA", ((2 * r + 4) * S, (2 * r + 4) * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = (r + 2) * S
    d.ellipse((c - r * S, c - r * S, c + r * S, c + r * S), fill=(22, 22, 24))
    d.ellipse((c - (r - 10) * S, c - (r - 10) * S, c + (r - 10) * S, c + (r - 10) * S), outline=(40, 40, 44), width=3 * S)
    rr = int(r * 0.6)
    d.ellipse((c - rr * S, c - rr * S, c + rr * S, c + rr * S), fill=(190, 192, 200))
    for k in range(5):
        a = k * 2 * math.pi / 5
        d.line([(c, c), (c + math.cos(a) * rr * 0.95 * S, c + math.sin(a) * rr * 0.95 * S)], fill=(120, 122, 130), width=12 * S)
    d.ellipse((c - 14 * S, c - 14 * S, c + 14 * S, c + 14 * S), fill=(80, 80, 88))
    return im.resize((2 * r + 4, 2 * r + 4), Image.LANCZOS)


class Car:
    def __init__(self, kind):
        self.kind = kind
        self.c = CARS[kind]
        self.layers = _car_layers(kind)
        w = wheel_image(self.c["r"])
        self.wheels = [w.rotate(-k * 2, resample=Image.BICUBIC) for k in range(36)]  # 72° symmetric, 2° steps

    def draw(self, frame, cx, dist, t, heads, night=False):
        """heads: list of (head_img, neck_offset) per seat, or None."""
        c = self.c
        ox = int(cx - 500)
        bounce = 2.6 * math.sin(t * 11.0) + 1.6 * math.sin(t * 17.3 + 1) + 4 * max(0, math.sin(t * 1.7)) ** 30
        oy = int(ROAD_Y - c["r"] - c["wheels"][0][1] - 6 + bounce)  # body rides on the suspension
        # ground shadow
        sh = Image.new("RGBA", (1000, 80), (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((40, 20, 960, 70), fill=(0, 0, 0, 120))
        frame.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)), (ox, ROAD_Y - 40))
        cabin = self.layers["interior"].copy()
        for (sx, sy), hd in zip(c["seats"], heads):
            if hd is None:
                continue
            img, (nx, ny) = hd
            cabin.alpha_composite(img, (int(sx - img.width / 2), int(sy - img.height * 0.56)))
        cabin.putalpha(self.layers["interior"].getchannel("A"))  # passengers only visible through the windows
        frame.alpha_composite(cabin, (ox, oy))
        frame.alpha_composite(self.layers["body"], (ox, oy))
        frame.alpha_composite(self.layers["glass"], (ox, oy))
        ang = (dist / c["r"]) * 180 / math.pi
        wi = self.wheels[int((ang % 72) / 2) % 36]
        for (wx, wy) in c["wheels"]:
            frame.alpha_composite(wi, (int(ox + wx - wi.width / 2), int(ROAD_Y - wi.height + 2)))
        if night:
            beam = Image.new("RGBA", (700, 300), (0, 0, 0, 0))
            ImageDraw.Draw(beam).polygon([(0, 140), (700, 20), (700, 290)], fill=(255, 250, 200, 70))
            frame.alpha_composite(beam.filter(ImageFilter.GaussianBlur(18)), (ox + 940, oy + 270))
            add_light_rgba(frame, glow((240, 240), (255, 250, 210), 2.0, 0.9), (ox + 820, oy + 290))
            add_light_rgba(frame, glow((160, 160), (255, 40, 40), 2.0, 0.8), (ox - 40, oy + 310))


def add_light_rgba(frame, light, pos):
    """Additive light on an RGBA frame."""
    x, y = pos
    w, h = light.size
    x0, y0, x1, y1 = max(0, x), max(0, y), min(frame.width, x + w), min(frame.height, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    reg = np.asarray(frame.crop((x0, y0, x1, y1)), float)
    la = np.asarray(light.crop((x0 - x, y0 - y, x1 - x, y1 - y)), float)
    reg[..., :3] = np.clip(reg[..., :3] + la[..., :3] * la[..., 3:4] / 255, 0, 255)
    frame.paste(Image.fromarray(reg.astype(np.uint8), "RGBA"), (x0, y0))


# ---------------------------------------------------------------- road backgrounds

TILE = 2160


def _smear(img, px):
    """Horizontal motion blur by averaging shifted copies (for fast-moving layers)."""
    a = np.asarray(img, float)
    acc = np.zeros_like(a)
    n = 9
    for k in range(n):
        acc += np.roll(a, int((k - n // 2) * px / n), axis=1)
    return Image.fromarray((acc / n).astype(np.uint8), img.mode)


def road_layers(night, seed=41):
    rnd = random.Random(seed)
    L = {}
    if night:
        sky = grad(W, H, (4, 6, 22), (30, 26, 60))
        d = ImageDraw.Draw(sky)
        for _ in range(160):
            x, y = rnd.randint(0, W), rnd.randint(0, 800)
            c = rnd.randint(130, 255)
            d.point((x, y), fill=(c, c, c))
        d.ellipse((780, 300, 900, 420), fill=(245, 240, 220))
        add_light(sky, glow((500, 500), (200, 200, 255), 2, 0.4), (590, 110))
    else:
        sky = grad(W, H, (70, 140, 225), (190, 225, 250))
        add_light(sky, glow((700, 700), (255, 255, 220), 1.8, 0.7), (550, 0))
    L["sky"] = sky
    # far layer: skyline / hills
    far = Image.new("RGBA", (TILE, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(far)
    x = 0
    while x < TILE:
        if night:
            bw, bh = rnd.randint(70, 160), rnd.randint(250, 700)
            top = 1330 - bh
            d.rectangle((x, top, x + bw, 1330), fill=(16, 18, 34, 255))
            for yy in range(top + 14, 1320, 26):
                for xx in range(x + 10, x + bw - 10, 20):
                    if rnd.random() < 0.3:
                        d.rectangle((xx, yy, xx + 8, yy + 12), fill=(255, 205, 110, 255))
            x += bw + rnd.randint(0, 12)
        else:
            r = rnd.randint(260, 520)
            d.ellipse((x - r, 1250 - r * 0.5, x + r, 1250 + r * 0.5), fill=(110, 160, 110, 255))
            x += rnd.randint(250, 420)
    if not night:
        d.rectangle((0, 1250, TILE, 1340), fill=(110, 160, 110, 255))
    L["far"] = far
    # mid layer: houses & trees by day, street lamps at night
    mid = Image.new("RGBA", (TILE, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(mid)
    if night:
        for x in range(150, TILE, 540):
            d.rectangle((x, 640, x + 16, 1340), fill=(40, 42, 54, 255))
            d.line([(x + 8, 650), (x + 120, 640)], fill=(40, 42, 54, 255), width=12)
            d.rounded_rectangle((x + 90, 628, x + 170, 652), 8, fill=(255, 240, 200, 255))
            g = glow((420, 420), (255, 220, 150), 2.0, 0.85)
            mid.alpha_composite(g, (x - 80, 430))
            d = ImageDraw.Draw(mid)
    else:
        x = 40
        while x < TILE:
            if rnd.random() < 0.55:
                hw, hh = rnd.randint(260, 360), rnd.randint(200, 260)
                col = rnd.choice([(235, 220, 190), (200, 220, 235), (240, 200, 190), (225, 230, 200)])
                d.rectangle((x, 1340 - hh, x + hw, 1340), fill=col + (255,))
                d.polygon([(x - 20, 1340 - hh), (x + hw / 2, 1340 - hh - 120), (x + hw + 20, 1340 - hh)],
                          fill=(150, 60, 50, 255))
                d.rectangle((x + hw / 2 - 30, 1340 - 110, x + hw / 2 + 30, 1340), fill=(110, 70, 40, 255))
                for wx in (x + 40, x + hw - 100):
                    d.rectangle((wx, 1340 - hh + 50, wx + 60, 1340 - hh + 110), fill=(150, 200, 230, 255))
                x += hw + 60
            else:
                d.rectangle((x + 40, 1180, x + 60, 1340), fill=(100, 70, 40, 255))
                d.ellipse((x - 30, 1000, x + 130, 1220), fill=(60, 130, 60, 255))
                x += 200
    L["mid"] = mid
    # road
    road = Image.new("RGBA", (TILE, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(road)
    d.rectangle((0, 1340, TILE, 1400), fill=(150, 150, 150, 255) if not night else (60, 60, 70, 255))  # sidewalk
    d.rectangle((0, 1400, TILE, H), fill=(60, 62, 68, 255) if not night else (28, 30, 36, 255))
    d.rectangle((0, 1400, TILE, 1408), fill=(200, 200, 200, 255) if not night else (110, 110, 120, 255))
    for x in range(0, TILE, 240):
        d.rectangle((x, 1750, x + 130, 1764), fill=(240, 220, 120, 255))
    for x in range(0, TILE, 360):  # far-lane dashes
        d.rectangle((x, 1460, x + 160, 1468), fill=(200, 200, 200, 200))
    L["road"] = road
    return L


def draw_road(frame, L, dist, night, blur_mid=False):
    frame.paste(L["sky"], (0, 0))
    for key, par in (("far", 0.12), ("mid", 0.45), ("road", 1.0)):
        off = int(dist * par) % TILE
        lay = L[key]
        frame.alpha_composite(lay.crop((off, 0, min(off + W, TILE), H)), (0, 0))
        if off + W > TILE:
            frame.alpha_composite(lay.crop((0, 0, off + W - TILE, H)), (TILE - off, 0))


def draw_cyclist(frame, x, t):
    """Simple cyclist in the far lane (for the slow-grandpa gag)."""
    d = ImageDraw.Draw(frame, "RGBA")
    y = 1450
    for wx in (x - 70, x + 70):
        d.ellipse((wx - 55, y - 55, wx + 55, y + 55), outline=(20, 20, 20), width=8)
        a = t * 14
        d.line([(wx + 50 * math.cos(a), y + 50 * math.sin(a)), (wx - 50 * math.cos(a), y - 50 * math.sin(a))], fill=(80, 80, 80), width=3)
    d.line([(x - 70, y), (x, y - 70), (x + 70, y), (x - 10, y)], fill=(230, 60, 60), width=8)
    d.line([(x, y - 70), (x - 20, y - 160)], fill=(40, 120, 220), width=26)
    d.line([(x - 20, y - 150), (x + 50, y - 90)], fill=(40, 120, 220), width=16)
    d.ellipse((x - 50, y - 225, x + 6, y - 165), fill=(200, 150, 110))
    d.chord((x - 56, y - 235, x + 12, y - 180), 180, 360, fill=(250, 220, 0))
    k = math.sin(t * 9)
    d.line([(x - 15, y - 80), (x + 15 * k, y - 20)], fill=(30, 30, 30), width=14)
    d.line([(x - 15, y - 80), (x - 15 * k, y - 20)], fill=(30, 30, 30), width=14)
