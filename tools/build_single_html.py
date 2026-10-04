#!/usr/bin/env python3
"""app/ を、全部入りの1つのHTMLファイル（dist/jigsaw-sticker-book.html）にまとめる。

  python3 tools/build_single_html.py

CSS と JS を HTML の中に埋めこむだけ（外部通信なし・ビルド用の道具も不要）。
試作ギャラリーへのリンクは、単体では行き先がないので外す。
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
app = root / "app"
html = (app / "index.html").read_text(encoding="utf-8")


def inline_css(m):
    return "<style>\n" + (app / m.group(1)).read_text(encoding="utf-8") + "\n</style>"


def inline_js(m):
    js = (app / m.group(1)).read_text(encoding="utf-8")
    if m.group(1).endswith("ui.js"):
        js = re.sub(r'\s*<footer class="hfoot">.*?</footer>', "", js, count=1, flags=re.S)
    return "<script>\n" + js.replace("</script", "<\\/script") + "\n</script>"


html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)
# ホーム画面に追加したときに、全画面アプリのように見せる
html = html.replace(
    "<title>",
    '<meta name="apple-mobile-web-app-capable" content="yes">\n'
    '<meta name="mobile-web-app-capable" content="yes">\n'
    '<meta name="apple-mobile-web-app-title" content="ジグソー">\n'
    '<meta name="theme-color" content="#7a4b16">\n<title>',
    1,
)
out = root / "dist" / "jigsaw-sticker-book.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"{out}  {out.stat().st_size / 1024:.0f} KB")
leftover = re.findall(r'(?:href|src)="(?!data:|#)[^"]*\.(?:css|js)"', html)
print("外部ファイルの参照:", leftover or "なし")
