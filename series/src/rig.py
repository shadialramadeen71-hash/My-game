"""Full-body cartoon rig: heads with lip-sync variants + posable bodies (walk, idle, talk, cheer)."""
import math
from PIL import Image, ImageDraw, ImageEnhance

import art
from art import NAVY, GOLD, WHITE, font, _p, _e, S

# ---------------------------------------------------------------- heads


def _face(d, skin, skin_d, mouth, blink, brow=(25, 15, 10), brow_w=11, lashes=False, lips=None, iris=(45, 28, 18)):
    if blink:
        d.line(_p([(247, 362), (285, 362)]), fill=(30, 18, 12), width=5 * S)
        d.line(_p([(315, 362), (353, 362)]), fill=(30, 18, 12), width=5 * S)
    else:
        for cx in (266, 334):
            d.ellipse(_e([cx - 21, 350, cx + 21, 375]), fill=(245, 240, 235))
            d.ellipse(_e([cx - 10, 351, cx + 10, 374]), fill=iris)
            d.ellipse(_e([cx - 4, 355, cx + 2, 361]), fill=WHITE)
            if lashes:
                side = -1 if cx < 300 else 1
                for k in range(3):
                    x = cx + side * (8 + k * 6)
                    d.line(_p([(x, 352), (x + side * 6, 343)]), fill=(20, 12, 10), width=3 * S)
    d.line(_p([(245, 330), (290, 324)]), fill=brow, width=brow_w * S)
    d.line(_p([(310, 324), (355, 330)]), fill=brow, width=brow_w * S)
    d.polygon(_p([(300, 375), (288, 422), (300, 430), (312, 422)]), fill=skin_d)
    d.ellipse(_e([284, 416, 316, 434]), fill=skin_d)
    lip = lips or (60, 30, 25)
    if mouth == 0:
        d.line(_p([(275, 458), (300, 463), (325, 458)]), fill=lip, width=7 * S, joint="curve")
    elif mouth == 1:
        d.ellipse(_e([278, 450, 322, 474]), fill=(55, 20, 22), outline=lips, width=(4 * S if lips else 0))
        d.rectangle(_e([285, 452, 315, 457]), fill=(240, 236, 230))
    else:
        d.ellipse(_e([272, 444, 328, 490]), fill=(55, 20, 22), outline=lips, width=(4 * S if lips else 0))
        d.rectangle(_e([283, 447, 317, 455]), fill=(240, 236, 230))
        d.ellipse(_e([286, 472, 314, 486]), fill=(170, 70, 70))


def _base_head(d, skin, skin_l, skin_d):
    d.rounded_rectangle(_e([252, 450, 348, 600]), 30 * S, fill=skin_d)
    d.ellipse(_e([186, 330, 226, 405]), fill=skin)
    d.ellipse(_e([374, 330, 414, 405]), fill=skin)
    d.ellipse(_e([206, 196, 400, 494]), fill=skin_l)
    d.ellipse(_e([200, 200, 394, 498]), fill=skin)


def head_mom(mouth, blink):
    img = Image.new("RGBA", (600 * S, 900 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin, skin_l, skin_d = (112, 70, 42), (152, 100, 62), (82, 50, 28)
    hair = (28, 18, 14)
    d.ellipse(_e([150, 70, 450, 330]), fill=hair)  # big afro puff
    d.ellipse(_e([180, 230, 230, 440]), fill=hair)
    d.ellipse(_e([370, 230, 420, 440]), fill=hair)
    _base_head(d, skin, skin_l, skin_d)
    d.chord(_e([196, 190, 404, 360]), 180, 360, fill=hair)
    d.rounded_rectangle(_e([190, 250, 410, 268]), 8 * S, fill=GOLD)  # headband
    for cx in (196, 404):  # hoop earrings
        d.ellipse(_e([cx - 22, 392, cx + 22, 450]), outline=GOLD, width=6 * S)
    _face(d, skin, skin_d, mouth, blink, lashes=True, lips=(170, 50, 80), brow_w=8)
    return img.resize((600, 900), Image.LANCZOS)


def head_kayla(mouth, blink):
    img = Image.new("RGBA", (600 * S, 900 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin, skin_l, skin_d = (128, 80, 46), (168, 112, 70), (92, 56, 30)
    hair = (30, 20, 16)
    d.ellipse(_e([130, 120, 260, 250]), fill=hair)
    d.ellipse(_e([340, 120, 470, 250]), fill=hair)
    _base_head(d, skin, skin_l, skin_d)
    d.chord(_e([196, 192, 404, 380]), 180, 360, fill=hair)
    for cx in (210, 390):  # bows
        d.polygon(_p([(cx - 34, 220), (cx, 238), (cx - 34, 256)]), fill=(255, 90, 160))
        d.polygon(_p([(cx + 34, 220), (cx, 238), (cx + 34, 256)]), fill=(255, 90, 160))
        d.ellipse(_e([cx - 9, 229, cx + 9, 247]), fill=(230, 60, 130))
    for x, y in ((250, 410), (262, 418), (340, 412), (352, 404)):  # freckles
        d.ellipse(_e([x - 3, y - 3, x + 3, y + 3]), fill=skin_d)
    _face(d, skin, skin_d, mouth, blink, lashes=True, brow_w=7, lips=(150, 60, 70))
    return img.resize((600, 900), Image.LANCZOS)


def head_grandpa(mouth, blink):
    img = Image.new("RGBA", (600 * S, 900 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin, skin_l, skin_d = (96, 62, 38), (135, 92, 60), (70, 44, 26)
    _base_head(d, skin, skin_l, skin_d)
    d.ellipse(_e([250, 215, 300, 250]), fill=skin_l)  # shiny bald spot
    for cx in (210, 390):  # white side hair
        d.ellipse(_e([cx - 26, 290, cx + 26, 360]), fill=(235, 235, 235))
    for y in (262, 278, 294):  # forehead wrinkles
        d.arc(_e([250, y - 10, 350, y + 10]), 200, 340, fill=skin_d, width=3 * S)
    _face(d, skin, skin_d, mouth, blink, brow=(240, 240, 240), brow_w=14)
    for cx in (266, 334):  # round glasses
        d.ellipse(_e([cx - 32, 334, cx + 32, 392]), outline=(40, 40, 40), width=5 * S)
    d.line(_p([(298, 360), (302, 360)]), fill=(40, 40, 40), width=5 * S)
    d.chord(_e([248, 420, 352, 470]), 180, 360, fill=(240, 240, 240))  # big mustache
    d.ellipse(_e([240, 425, 280, 455]), fill=(240, 240, 240))
    d.ellipse(_e([320, 425, 360, 455]), fill=(240, 240, 240))
    return img.resize((600, 900), Image.LANCZOS)


def head_linda(mouth, blink):
    img = Image.new("RGBA", (600 * S, 900 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin, skin_l, skin_d = (236, 192, 160), (250, 214, 186), (205, 155, 125)
    hair = (205, 205, 212)
    d.rounded_rectangle(_e([176, 180, 424, 470]), 90 * S, fill=hair)  # silver bob
    _base_head(d, skin, skin_l, skin_d)
    d.chord(_e([192, 180, 408, 360]), 180, 360, fill=hair)
    d.pieslice(_e([200, 190, 330, 340]), 180, 300, fill=(225, 225, 230))  # side-swept bangs
    for cx in (200, 400):  # pearl earrings
        d.ellipse(_e([cx - 10, 405, cx + 10, 425]), fill=(250, 250, 245))
    _face(d, skin, skin_d, mouth, blink, brow=(150, 140, 135), brow_w=7, lashes=True, lips=(190, 70, 85),
          iris=(70, 110, 140))
    for cx, side in ((266, -1), (334, 1)):  # red cat-eye glasses
        d.polygon(_p([(cx - 34, 344), (cx + 34, 344), (cx + 30, 384), (cx - 30, 384)]), outline=(200, 30, 50))
        d.line(_p([(cx - 34, 344), (cx + 34, 344), (cx + 30, 384), (cx - 30, 384), (cx - 34, 344)]),
               fill=(200, 30, 50), width=5 * S)
        tip = cx + side * 34
        d.line(_p([(tip, 344), (tip + side * 12, 334)]), fill=(200, 30, 50), width=5 * S)
    return img.resize((600, 900), Image.LANCZOS)


HEADS = {
    "MARCUS": lambda m, b: art.draw_marcus(mouth=m, blink=b),
    "COACH": lambda m, b: art.draw_coach(mouth=m, blink=b),
    "MOM": head_mom, "KAYLA": head_kayla, "GRANDPA": head_grandpa, "LINDA": head_linda,
}

HEAD_CROP = (100, 60, 500, 590)  # in 600x900 head canvas units; neck bottom at crop bottom
NECK = (200, 530)               # neck point inside crop

# ---------------------------------------------------------------- bodies

SPECS = {
    "MARCUS": dict(scale=1.0, skin=(120, 74, 42), shirt=NAVY, sleeve=NAVY, sleeve_len=0.5, pants=(240, 240, 240),
                   shin=NAVY, shoe=(20, 20, 24), shw=132, deco="jersey7"),
    "COACH": dict(scale=1.0, skin=(226, 172, 128), shirt=(34, 38, 48), sleeve=(34, 38, 48), sleeve_len=1.0,
                  pants=(186, 166, 126), shin=(186, 166, 126), shoe=(240, 240, 240), shw=118, deco="coach"),
    "MOM": dict(scale=0.92, skin=(112, 70, 42), shirt=GOLD, sleeve=GOLD, sleeve_len=0.4, pants=(60, 90, 160),
                shin=(60, 90, 160), shoe=(255, 110, 170), shw=104, deco="qbmom"),
    "KAYLA": dict(scale=0.68, skin=(128, 80, 46), shirt=NAVY, sleeve=NAVY, sleeve_len=0.45, pants=(150, 80, 200),
                  shin=(150, 80, 200), shoe=(250, 250, 250), shw=108, deco="kid7"),
    "GRANDPA": dict(scale=0.93, skin=(96, 62, 38), shirt=(120, 72, 44), sleeve=(120, 72, 44), sleeve_len=1.0,
                    pants=(110, 110, 118), shin=(110, 110, 118), shoe=(80, 50, 30), shw=112, deco="cardigan"),
    "LINDA": dict(scale=0.9, skin=(236, 192, 160), shirt=(40, 140, 150), sleeve=(40, 140, 150), sleeve_len=1.0,
                  pants=(30, 40, 80), shin=(30, 40, 80), shoe=(30, 30, 34), shw=104, deco="linda"),
}

CW, CH = 560, 1160
GROUND = 1140
SHOULDER_Y = 452
HIP_Y = 740
THIGH, SHIN = 205, 185


def _pt(a, ang, ln):
    r = math.radians(ang)
    return a[0] + ln * math.sin(r), a[1] + ln * math.cos(r)


def _limb(d, a, b, w, col):
    d.line([(a[0] * S, a[1] * S), (b[0] * S, b[1] * S)], fill=col, width=int(w * S))
    for p in (a, b):
        d.ellipse(((p[0] - w / 2) * S, (p[1] - w / 2) * S, (p[0] + w / 2) * S, (p[1] + w / 2) * S), fill=col)


def pose_params(kind, v=0.0):
    """Returns joint angles. Angles in degrees from straight down; + rotates toward +x."""
    if kind == "walk":
        ph = v * 2 * math.pi
        liftL = max(0.0, math.sin(ph)) * 60
        liftR = max(0.0, -math.sin(ph)) * 60
        sw = 12 * math.sin(ph)
        return dict(legL=(-3, 0, liftL), legR=(3, 0, liftR), armL=(-9 + sw, -12 + sw), armR=(9 + sw, 12 + sw),
                    bob=-8 * abs(math.sin(ph)))
    if kind == "talk":
        g = v
        return dict(legL=(-4, 0), legR=(4, 0), armL=(-9, -12), armR=(28 + 42 * g, 92 + 55 * g))
    if kind == "cheer":
        w = 10 * v
        return dict(legL=(-12, 4), legR=(12, 4), armL=(-150 - w, -168 - w), armR=(150 + w, 168 + w))
    if kind == "point":  # shouting / pointing up (fans)
        return dict(legL=(-6, 0), legR=(6, 0), armL=(-9, -12), armR=(135 + 10 * v, 170 + 6 * v))
    return dict(legL=(-4, 0), legR=(4, 0), armL=(-9, -12), armR=(9, 12))  # idle


def draw_body(who, kind, v=0.0):
    sp = SPECS[who]
    pp = pose_params(kind, v)
    img = Image.new("RGBA", (CW * S, CH * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = CW / 2
    # legs: compute joints, then plant the lowest foot on the ground
    legs = {}
    for side, key in ((-1, "legL"), (1, "legR")):
        hip = (cx + side * 40, HIP_Y)
        a, k, *lift = pp[key]
        lift = lift[0] if lift else 0
        knee = _pt(hip, a, THIGH - lift * 0.25)
        ankle = _pt(knee, a - k, SHIN - lift * 0.75)
        legs[side] = (hip, knee, ankle)
    low = max(legs[-1][2][1], legs[1][2][1])
    dy = (GROUND - 22) - low + pp.get("bob", 0)
    sh = lambda p: (p[0], p[1] + dy)
    for side in (-1, 1):
        hip, knee, ankle = (sh(p) for p in legs[side])
        _limb(d, hip, knee, 60, sp["pants"])
        _limb(d, knee, ankle, 52, sp["shin"])
        fx = ankle[0] + side * 10
        d.ellipse(((fx - 40) * S, (ankle[1] - 6) * S, (fx + 40) * S, (ankle[1] + 26) * S), fill=sp["shoe"])
    # pelvis / pants top
    top = SHOULDER_Y + dy
    hy = HIP_Y + dy
    d.rounded_rectangle(((cx - 70) * S, (hy - 40) * S, (cx + 70) * S, (hy + 30) * S), 26 * S, fill=sp["pants"])
    # torso
    shw = sp["shw"]
    torso = [(cx - shw, top + 8), (cx - shw + 18, top - 8), (cx + shw - 18, top - 8), (cx + shw, top + 8),
             (cx + shw - 34, hy - 22), (cx - shw + 34, hy - 22)]
    if sp["deco"] == "kid7":  # jersey dress reaching the thighs
        torso = torso[:4] + [(cx + shw - 10, hy + 70), (cx - shw + 10, hy + 70)]
    d.polygon([(x * S, y * S) for x, y in torso], fill=sp["shirt"])
    _torso_deco(d, sp, cx, top, hy, shw)
    # arms
    for side, key in ((-1, "armL"), (1, "armR")):
        shp = (cx + side * (shw - 22), top + 22)
        ua, fa = pp[key]
        elbow = _pt(shp, ua, 150 if who != "KAYLA" else 140)
        hand = _pt(elbow, fa, 138 if who != "KAYLA" else 128)
        sl = sp["sleeve_len"]
        if sl >= 1:
            _limb(d, shp, elbow, 50, sp["sleeve"])
            _limb(d, elbow, hand, 44, sp["sleeve"])
        else:
            _limb(d, shp, elbow, 44, sp["skin"])
            _limb(d, elbow, hand, 40, sp["skin"])
            mid = (shp[0] + (elbow[0] - shp[0]) * sl * 1.4, shp[1] + (elbow[1] - shp[1]) * sl * 1.4)
            _limb(d, shp, mid, 58, sp["sleeve"])
            if sp["deco"] == "jersey7":
                q = (shp[0] + (elbow[0] - shp[0]) * 0.55, shp[1] + (elbow[1] - shp[1]) * 0.55)
                d.ellipse(((q[0] - 12) * S, (q[1] - 12) * S, (q[0] + 12) * S, (q[1] + 12) * S), fill=GOLD)
        d.ellipse(((hand[0] - 23) * S, (hand[1] - 23) * S, (hand[0] + 23) * S, (hand[1] + 23) * S), fill=sp["skin"])
        if who == "KAYLA" and side == 1 and kind in ("point", "cheer"):  # foam finger
            d.rounded_rectangle(((hand[0] - 30) * S, (hand[1] - 40) * S, (hand[0] + 30) * S, (hand[1] + 20) * S),
                                14 * S, fill=GOLD)
            d.rounded_rectangle(((hand[0] - 10) * S, (hand[1] - 120) * S, (hand[0] + 12) * S, (hand[1] - 30) * S),
                                10 * S, fill=GOLD)
            d.text((hand[0] * S, (hand[1] - 8) * S), "#1", font=font("Anton.ttf", 30 * S), fill=NAVY, anchor="mm")
    sc = sp["scale"]
    out = img.resize((int(CW * sc), int(CH * sc)), Image.LANCZOS)
    neck = (cx * sc, (top + 4) * sc)
    return out, neck


def _torso_deco(d, sp, cx, top, hy, shw):
    deco = sp["deco"]
    if deco in ("jersey7", "kid7"):
        d.polygon([(x * S, y * S) for x, y in [(cx - 50, top - 8), (cx + 50, top - 8), (cx, top + 46)]], fill=GOLD)
        d.polygon([(x * S, y * S) for x, y in [(cx - 34, top - 8), (cx + 34, top - 8), (cx, top + 28)]], fill=NAVY)
        d.text((cx * S, (top + 150) * S), "7", font=font("Anton.ttf", 170 * S), fill=WHITE, anchor="mm",
               stroke_width=7 * S, stroke_fill=GOLD)
        if deco == "jersey7":
            d.rectangle(((cx - shw + 34) * S, (hy - 34) * S, (cx + shw - 34) * S, (hy - 22) * S), fill=GOLD)
    elif deco == "coach":
        d.polygon([(x * S, y * S) for x, y in [(cx - 54, top - 8), (cx, top + 70), (cx + 54, top - 8)]], fill=GOLD)
        d.polygon([(x * S, y * S) for x, y in [(cx - 34, top - 8), (cx, top + 44), (cx + 34, top - 8)]], fill=(34, 38, 48))
        d.line([(cx * S, (top + 70) * S), (cx * S, (hy - 22) * S)], fill=(90, 95, 110), width=4 * S)
        d.ellipse(((cx + 40) * S, (top + 70) * S, (cx + 90) * S, (top + 120) * S), fill=NAVY, outline=GOLD, width=4 * S)
        d.text(((cx + 65) * S, (top + 96) * S), "S", font=font("Anton.ttf", 34 * S), fill=GOLD, anchor="mm")
        d.line([((cx - 40) * S, top * S), ((cx - 50) * S, (top + 150) * S)], fill=(200, 30, 40), width=5 * S)
        d.line([((cx + 40) * S, top * S), ((cx - 46) * S, (top + 150) * S)], fill=(200, 30, 40), width=5 * S)
        d.rounded_rectangle(((cx - 68) * S, (top + 144) * S, (cx - 30) * S, (top + 166) * S), 6 * S, fill=(190, 190, 195))
    elif deco == "qbmom":
        d.text((cx * S, (top + 95) * S), "QB", font=font("Anton.ttf", 78 * S), fill=NAVY, anchor="mm")
        d.text((cx * S, (top + 175) * S), "MOM", font=font("Anton.ttf", 78 * S), fill=NAVY, anchor="mm")
        d.ellipse(((cx + 50) * S, (top + 20) * S, (cx + 80) * S, (top + 50) * S), fill=(220, 30, 60))
    elif deco == "cardigan":
        d.polygon([(x * S, y * S) for x, y in [(cx - 40, top - 8), (cx + 40, top - 8), (cx + 18, hy - 22), (cx - 18, hy - 22)]],
                  fill=(240, 236, 228))
        d.polygon([(x * S, y * S) for x, y in [(cx - 26, top + 4), (cx, top + 16), (cx - 26, top + 28)]], fill=GOLD)
        d.polygon([(x * S, y * S) for x, y in [(cx + 26, top + 4), (cx, top + 16), (cx + 26, top + 28)]], fill=GOLD)
        for k in range(4):
            d.ellipse(((cx + 26) * S, (top + 70 + k * 55) * S, (cx + 38) * S, (top + 82 + k * 55) * S), fill=(230, 200, 140))
    elif deco == "linda":
        d.polygon([(x * S, y * S) for x, y in [(cx - 36, top - 8), (cx + 36, top - 8), (cx + 14, hy - 22), (cx - 14, hy - 22)]],
                  fill=(250, 250, 250))
        for k in range(6):
            a = k / 6 * math.pi
            d.ellipse(((cx - 30 + 60 * k / 5) * S, (top + 6 + 18 * math.sin(a)) * S,
                       (cx - 22 + 60 * k / 5) * S, (top + 14 + 18 * math.sin(a)) * S), fill=(250, 250, 245))


class Actor:
    """Pre-rendered poses + heads for one character."""
    WALK_FRAMES = 12
    TALK_FRAMES = 6

    def __init__(self, who):
        self.who = who
        sc = SPECS[who]["scale"]
        self.scale = sc
        self.poses = {}
        for i in range(self.WALK_FRAMES):
            self.poses[("walk", i)] = draw_body(who, "walk", i / self.WALK_FRAMES)
        for i in range(self.TALK_FRAMES):
            self.poses[("talk", i)] = draw_body(who, "talk", i / (self.TALK_FRAMES - 1))
        for i in range(2):
            self.poses[("cheer", i)] = draw_body(who, "cheer", i)
            self.poses[("point", i)] = draw_body(who, "point", i)
        self.poses[("idle", 0)] = draw_body(who, "idle")
        self.dim = {}
        for k, (im, nk) in self.poses.items():
            self.dim[k] = (_dim(im), nk)
        self.heads, self.heads_dim = {}, {}
        x0, y0, x1, y1 = HEAD_CROP
        hw, hh = int((x1 - x0) * sc), int((y1 - y0) * sc)
        for m in (0, 1, 2):
            for b in (False, True):
                full = HEADS[who](m, b)
                h = full.crop((x0, y0, x1, y1)).resize((hw, hh), Image.LANCZOS)
                self.heads[(m, b)] = h
                self.heads_dim[(m, b)] = _dim(h)
        self.neck_in_head = (NECK[0] * sc, NECK[1] * sc)
        self.width = int(CW * sc)
        self.height = int(CH * sc)

    def compose(self, frame, x, ground_y, pose, mouth, blink, active=True, lift=0):
        body, neck = (self.poses if active else self.dim)[pose]
        head = (self.heads if active else self.heads_dim)[(mouth, blink)]
        bx = int(x - body.width / 2)
        by = int(ground_y - body.height - lift)
        frame.paste(body, (bx, by), body)
        hx = int(bx + neck[0] - self.neck_in_head[0])
        hy = int(by + neck[1] - self.neck_in_head[1])
        frame.paste(head, (hx, hy), head)


def _dim(im):
    rgb = ImageEnhance.Brightness(im.convert("RGB")).enhance(0.72)
    rgb = ImageEnhance.Color(rgb).enhance(0.75)
    rgb.putalpha(im.getchannel("A"))
    return rgb
