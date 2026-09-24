"""Generate the extension's bundled toolbar icons (requires Pillow)."""

from pathlib import Path

from PIL import Image, ImageDraw


OUTPUT = Path(__file__).resolve().parents[1] / "assets"
OUTPUT.mkdir(exist_ok=True)


def scaled(point, factor):
    return tuple(round(part * factor) for part in point)


for size in (16, 32, 48):
    factor = size * 8 / 48
    dimension = size * 8
    image = Image.new("RGBA", (dimension, dimension), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, dimension - 1, dimension - 1), radius=round(12 * factor), fill="#0969da")
    white = "#ffffff"
    width = max(2, round(3.8 * factor))
    draw.line([scaled((13, 35), factor), scaled((32, 16), factor)], fill=white, width=width, joint="curve")
    draw.line([scaled((28, 14), factor), scaled((34, 20), factor)], fill=white, width=width, joint="curve")
    for x, y, arm in ((14, 13, 5), (35, 33, 4)):
        cx, cy = scaled((x, y), factor)
        radius = round(arm * factor)
        draw.line((cx - radius, cy, cx + radius, cy), fill=white, width=max(2, round(2.2 * factor)))
        draw.line((cx, cy - radius, cx, cy + radius), fill=white, width=max(2, round(2.2 * factor)))
    image.resize((size, size), Image.Resampling.LANCZOS).save(OUTPUT / f"icon{size}.png")
