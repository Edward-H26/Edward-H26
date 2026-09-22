#!/usr/bin/env python3
"""Give every paper figure the same frame, the same margin, and the same visual weight.

Paper figures arrive at whatever size and with whatever white border the authors left in, so
dropping them into one card leaves each one padded differently (AC3S is nearly square, REVA is
twice as wide). This trims each figure to its own ink, scales it to fit one shared inner box, and
centres it on one shared canvas, so every card shows the same MARGIN on all four sides and the two
shapes carry a comparable amount of extra white on the axis they cannot fill.

The inner box is deliberately wider than the canvas ratio: at 1.577 the leftover white is about the
same for a 1.27-wide figure and a 2.19-wide one, which is the closest the two shapes can get to
matching. MARGIN is 9% of the canvas width because the venue badge that the sites and the README
draw over the top-left corner is about 8% of the card wide, and it must not cover the figure.

Run it after adding or replacing any figure; it is idempotent, since the margin it adds is white
and gets trimmed again on the next run.
"""

from pathlib import Path
from PIL import Image, ImageChops

CANVAS = (1080, 756)  # 10:7, the frame both sites and the README already use
MARGIN = 97  # 9% of the canvas width, wide enough to keep the badge off the figure
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
        inner = (CANVAS[0] - 2 * MARGIN, CANVAS[1] - 2 * MARGIN)
        scale = min(inner[0] / figure.width, inner[1] / figure.height)
        size = (round(figure.width * scale), round(figure.height * scale))
        canvas.paste(figure.resize(size, Image.Resampling.LANCZOS), ((CANVAS[0] - size[0]) // 2, (CANVAS[1] - size[1]) // 2))
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
