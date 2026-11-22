import json
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

project = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
width, height, fps, duration = 1280, 720, 24, 28
ink, paper, lime = "#20382a", "#f9faf1", "#def383"
muted = "#556c5b"
font_dir = Path("/System/Library/Fonts/Supplemental")
font = lambda size, bold=False: ImageFont.truetype(str(font_dir / ("Arial Bold.ttf" if bold else "Arial.ttf")), size)
brand, heading, medium, text, tiny = font(30, True), font(39, True), font(27, True), font(19), font(15, True)
frames = [
    (0, 9, "ACT 2  /  LIVE TRACE", "Watch a login walk in", "A real request moves through four layers of The Tiny Shop."),
    (9, 17, "ACT 3  /  FAULT INJECTION", "Break the login test", "Remove email lowercasing. The same test now fails at Auth Service."),
    (17, 28, "ACT 4  /  VERIFIED REPAIR", "Fix the room", "Restore normalization. The figure gets up and finishes the request."),
]
room_points = {}
for floor in range(4):
    rooms = [room for room in project["rooms"] if room["floor"] == floor]
    for idx, room in enumerate(rooms):
        room_points[room["id"]] = ((idx + .5) * 570 / len(rooms), 5, floor)
floor_info = project["floors"]

def projected(point):
    x, z, level = point
    return (90 + x + .61 * z, 568 - 111 * level + .19 * x - .50 * z)

def polygon(draw, corners, fill, outline=None, thick=1):
    points = [projected(p) for p in corners]
    draw.polygon(points, fill=fill, outline=outline, width=thick)
    return points

def ell(draw, x, y, r, color):
    draw.ellipse((x-r, y-r, x+r, y+r), fill=color)

def step_at(events, local):
    cumulative = 0
    for index, event in enumerate(events):
        length = max(event["delay"] / 1000, .10)
        if local < cumulative + length:
            return index, (local - cumulative) / length
        cumulative += length
    return len(events) - 1, 1

def title_case(identifier):
    return next(room["name"] for room in project["rooms"] if room["id"] == identifier)

def wrap(draw, copy, typeface, width):
    lines = []
    line = ""
    for word in copy.split():
        formed = f"{line} {word}".strip()
        if draw.textlength(formed, font=typeface) > width and line:
            lines.append(line)
            line = word
        else:
            line = formed
    return lines + [line]

for frame in range(fps * duration):
    t = frame / fps
    act = next(index for index, (_, end, *_rest) in enumerate(frames) if t < end)
    first, last, kicker, name, subtitle = frames[act]
    events = project["stages"][act]["trace"]["events"]
    n, blend = step_at(events, t - first - .7)
    event = events[n]
    old = events[max(0, n-1)]
    x0, y0 = projected(room_points[old["room"]])
    x1, y1 = projected(room_points[event["room"]])
    blend = max(0, min(1, blend * 2.2))
    x, y = (x0 + (x1-x0)*blend, y0 + (y1-y0)*blend)
    failure = act == 1 and event["status"] == "failed"
    repaired = act == 2 and t > 23
    if act == 2 and t < 20:
        x, y = projected(room_points["auth"])
        failure = True
    im = Image.new("RGB", (width, height), paper)
    d = ImageDraw.Draw(im)
    d.rectangle((0,0,1280,63), fill="#183226")
    d.rounded_rectangle((26,16,57,47), 6, fill=lime)
    d.polygon([(33,25),(41,20),(50,25),(41,31)], fill=ink)
    d.line([(33,30),(41,35),(50,30)], fill=ink, width=3)
    d.line([(33,37),(41,42),(50,37)], fill=ink, width=3)
    d.text((70,15), "WalkThrough.", font=brand, fill=paper)
    d.text((1035,22), "THE TINY SHOP  /  REPLAY", font=tiny, fill="#ccdfc4")
    d.rounded_rectangle((22,82,796,695), 12, fill="#172540", outline="#536782", width=2)
    for gy in range(94,688,16):
        for gx in range(36,787,16):
            ell(d, gx, gy, .85, "#34486a")
    labels = [((40,101), "REQUEST PATH", "#b9cce8")]
    for level in range(4):
        layer = floor_info[level]
        polygon(d, [(0,0,level),(598,0,level),(598,133,level),(0,133,level)], layer["tint"], "#8da491", 2)
        a, b = projected((0,0,level)), projected((598,0,level))
        d.polygon([a,b,(b[0],b[1]+10),(a[0],a[1]+10)], fill=layer["color"])
        labels.append(((32,a[1]-11), "0" + str(level+1), "#c3d4f0"))
        rooms = [room for room in project["rooms"] if room["floor"] == level]
        for idx, room in enumerate(rooms):
            start, end = 570*idx/len(rooms) + 4, 570*(idx+1)/len(rooms) - 4
            fill = layer["surface"] if room["status"] != "dust" else "#a99ab1"
            polygon(d, [(start,24,level),(end,24,level),(end,117,level),(start,117,level)], fill, layer["color"])
            tag = projected((start+7,52,level))
            labels.append((tag, room["name"], ink))
        labels.append(((600+65,projected((565,120,level))[1]-9), layer["title"], "#20334a"))
    visited = events[:n+1]
    if len(visited)>1:
        for a, b in zip(visited, visited[1:]):
            src, dst = projected(room_points[a["room"]]), projected(room_points[b["room"]])
            d.line([src, dst], fill="#77a85f", width=3)
    if failure:
        for i in range(21):
            f = ((i * .071) + t*.5) % 1
            ell(d, x + math.cos(i*2.4)*(21+f*17), y-f*54, 3+(1-f)*5, ("#c77d70","#e38c5b","#c2ac97")[i%3])
        d.rounded_rectangle((x-13,y-9,x+14,y+1), 4, fill="#d96645", outline="#803c28", width=2)
    else:
        ell(d,x,y-20,6,lime)
        d.line((x,y-13,x,y-4),fill="#54863d",width=7)
        d.line((x-7,y-13,x+7,y-9),fill="#54863d",width=4)
        d.line((x,y-5,x-6,y+3),fill="#54863d",width=4)
        d.line((x,y-5,x+6,y+3),fill="#54863d",width=4)
    viewport = im.crop((24, 84, 794, 694))
    viewport = viewport.resize((385, 305), Image.Resampling.BOX).resize(viewport.size, Image.Resampling.NEAREST)
    im.paste(viewport, (24, 84))
    for location, label, color in labels:
        d.text(location, label, font=tiny, fill=color)
    d.rounded_rectangle((816,82,1257,695),12,fill="#fffffa",outline="#d2e0cf",width=2)
    d.text((842,111),kicker,font=tiny,fill="#4d7654")
    d.text((842,138),name,font=heading,fill=ink)
    ytext=205
    for length in wrap(d, subtitle, text, 385):
        d.text((842,ytext),length,font=text,fill=muted)
        ytext+=24
    tag = title_case(event["room"])
    if failure:
        tag = "Auth Service · failing test"
    if repaired:
        tag = "Regression test passed"
    d.rounded_rectangle((842,273,1227,327),8,fill="#ffe6d7" if failure else "#e7f1ce")
    d.text((856,283),tag,font=medium,fill="#8e392b" if failure else "#315b3c")
    d.text((842,355),"EXECUTION LOG",font=tiny,fill="#4d7654")
    for offset, item in enumerate(events[max(0,n-4):n+1]):
        yy=389+offset*27
        d.text((842,yy),("• " + item["operation"])[:57],font=text,fill=ink)
    if act >= 1:
        d.text((842,556),"-  return value.trim();",font=text,fill="#a6513b")
        if act == 2:
            d.text((842,582),"+ return value.trim().toLowerCase();",font=text,fill="#3a6f4a")
    d.rectangle((842,659,1228,666),fill="#d9e6d3")
    d.rectangle((842,659,842+(1228-842)*t/duration,666),fill="#8bb45e")
    if t > 25:
        d.rounded_rectangle((31,572,781,684),9,fill="#20392c")
        d.text((52,595),"You walked into this codebase three minutes ago,",font=medium,fill=paper)
        d.text((52,633),"and it’s already fixed.",font=medium,fill=lime)
    im.save(out / f"{frame:04}.jpg", quality=84, optimize=True)
