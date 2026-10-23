"""링크 미리보기 이미지 만들기: og.html → src/app/opengraph-image.png (1200×630).
필요: python playwright + 크로미움. 실행: python3 scripts/og/render.py [크로미움 경로]"""
import pathlib, sys
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
out = here.parent.parent / "src" / "app" / "opengraph-image.png"
with sync_playwright() as p:
    kw = {"executable_path": sys.argv[1]} if len(sys.argv) > 1 else {}
    b = p.chromium.launch(**kw)
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto((here / "og.html").as_uri())
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(out))
    b.close()
print(out)
