#!/usr/bin/env python3
"""Give every paper figure the same frame and let each one fill it on its limiting axis.

Paper figures arrive at whatever size and with whatever white border the authors left in. This trims
each figure to its own ink and places it on one shared 16:9 canvas: a white band across the top is
reserved for the venue badge that the sites and the README draw over the top-left corner, and the
figure fills the area below it. A tall figure (AC3S, 1.28:1) fills the area's height, a wide one
(REVA, 2.19:1) fills its width, so both read as the same size instead of one shrinking to a strip
(Qiran, 2026-10-21; the earlier 10:7 canvas with equal margins left REVA at half the height).

Run it after adding or replacing any figure; it is idempotent, since the white it adds is trimmed
again on the next run.
"""

from pathlib import Path
from PIL import Image, ImageChops

CANVAS = (1200, 675)  # 16:9, the frame both sites and the README use
BAND = 110  # white band on top for the venue badge (16% of the height); the README keycap ends at 16%
SIDE = 36  # side and bottom margin, 3% of the width
WHITE = (255, 255, 255)
# The README owns the figures; the two sites read their own copies of the same files.
SOURCE = Path(__file__).resolve().parent.parent / "assets/papers/figures"
COPIES = [
    Path.home() / "Desktop/Edward-H26.github.io/public/images/papers",
    Path.home() / "Desktop/PersonalWebsite/public/images/papers",
]


def content_box(image):
    """The figure's own ink, ignoring the white border the author left around it."""
    diff = ImageChops.difference(image, Image.new("RGB", image.size, WHITE))
    return diff.convert("L").point([0] * 9 + [255] * 247).getbbox()


def normalize(path):
    image = Image.open(path).convert("RGB")
    canvas = Image.new("RGB", CANVAS, WHITE)
    box = content_box(image)
    if box:  # a blank placeholder stays blank
        figure = image.crop(box)
        inner = (CANVAS[0] - 2 * SIDE, CANVAS[1] - BAND - SIDE)
        scale = min(inner[0] / figure.width, inner[1] / figure.height)
        size = (round(figure.width * scale), round(figure.height * scale))
        canvas.paste(figure.resize(size, Image.Resampling.LANCZOS), ((CANVAS[0] - size[0]) // 2, BAND + (inner[1] - size[1]) // 2))
    canvas.save(path, "WEBP", quality=92, method=6)
    return box


def main():
    for path in sorted(SOURCE.glob("*.webp")):
        box = normalize(path)
        print(f"{path.name:16s} {'blank' if not box else f'content {box[2] - box[0]}x{box[3] - box[1]}'}")
        for directory in COPIES:
            (directory / path.name).write_bytes(path.read_bytes())


if __name__ == "__main__":
    main()
