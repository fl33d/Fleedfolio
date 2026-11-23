"""Read-only visual smoke checks against the branch's actual local React app.

The test creates only local browser storage; it never publishes a portfolio.
Run against `pnpm dev --host 127.0.0.1` on the review branch.
"""
from __future__ import annotations
import os
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

BASE = os.environ.get("FLEED_TEST_BASE", "http://127.0.0.1:3000")
OUT = Path("visual-review")
OUT.mkdir(exist_ok=True)

chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
if not chrome:
    raise RuntimeError("No browser executable found on this runner")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=chrome, headless=True, args=["--no-sandbox"])
    for width, height in ((320, 720), (390, 844), (768, 1024), (1440, 900)):
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=1,
            is_mobile=(width <= 390),
            has_touch=(width <= 390),
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(BASE, wait_until="domcontentloaded", timeout=45000)
        page.locator(".dock").wait_for(state="visible", timeout=30000)
        # With SSR+Vite the dock may be visible before the React hydration
        # handlers have loaded. Wait for network quiescence before clicking.
        page.wait_for_load_state("networkidle", timeout=30000)
        page.wait_for_timeout(700)
        assert not page.locator(".pf-mono-badge").count(), "Decorative badge has returned"
        assert page.get_by_role("button", name="Edit portfolio").count() == 1
        assert page.get_by_role("button", name="Preview portfolio").count() == 1
        assert page.get_by_role("button", name="Add an element").count() == 1
        assert page.get_by_role("button", name="Publish portfolio").count() == 1
        if width <= 390:
            assert page.locator(".dock .dock-action-label:visible").count() == 0, "Mobile toolbar has text labels"
            assert page.locator(".dock .dock-help:visible,.dock .dock-reset:visible,.dock .dock-cv:visible").count() == 0
            assert page.locator(".mode-edit .pf-nav:visible").count() == 0
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        assert scroll_width <= width + 2, f"Horizontal overflow {scroll_width}px at viewport {width}px"
        page.screenshot(path=str(OUT / f"home-{width}.png"))
        print(f"PASS initial viewport {width} — no page errors yet, no horizontal overflow")

        if width in (320, 390):
            page.get_by_role("button", name="Add an element").click()
            panel = page.get_by_role("dialog", name="Add to your portfolio")
            try:
                panel.wait_for(state="visible", timeout=7500)
            except Exception:
                page.screenshot(path=str(OUT / f"shelf-open-failure-{width}.png"))
                expanded = page.get_by_role("button", name="Add an element").get_attribute("aria-expanded")
                raise AssertionError(f"Library did not open: aria-expanded={expanded}; errors={errors}")
            bounds = panel.bounding_box()
            assert bounds, "Library is not laid out"
            assert bounds["x"] >= -2 and bounds["x"] + bounds["width"] <= width + 2, f"Library outside viewport: {bounds}"
            page.screenshot(path=str(OUT / f"shelf-{width}.png"))
            page.get_by_role("textbox", name="Find an element").fill("Freeform")
            assert page.locator(".el-options>button:visible").count() == 1
            page.locator(".el-options>button").first.click()
            assert page.locator("[id^=section-]").count() >= 1, "Freeform section did not get added"
            name = page.get_by_role("textbox", name="Name")
            name.fill("Mobile QA")
            page.wait_for_timeout(650)
            page.reload(wait_until="domcontentloaded")
            page.locator(".dock").wait_for(state="visible")
            assert page.get_by_role("textbox", name="Name").input_value() == "Mobile QA", "Draft persistence failed"
            assert page.locator("[id^=section-]").count() >= 1, "New block not persisted"
            print(f"PASS mobile shelf, insertion, editing and reload at {width}")

        assert not errors, f"Uncaught browser errors at {width}: {errors}"
        context.close()
    browser.close()
print("PASS actual React route / browser smoke checks")
