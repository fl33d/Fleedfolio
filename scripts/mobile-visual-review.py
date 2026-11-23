"""Read-only visual smoke checks against the branch's actual local React app.

The test creates only local browser storage; it never publishes a portfolio.
Run against `pnpm dev --host 127.0.0.1` on the review branch.
"""
from __future__ import annotations
import os
import json
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
        assert page.locator(".pf-nav").count() == 0, "Portfolio top navigation has returned"
        assert page.locator(".pf-canvas-start").count() == 0, "Extra header caption has returned"
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
            panel.locator("input[type=search]").fill("Freeform")
            assert page.locator(".el-options>button:visible").count() == 1
            page.locator(".el-options>button").first.click()
            assert page.locator("[id^=section-]").count() >= 1, "Freeform section did not get added"
            name = page.get_by_role("textbox", name="Name")
            name.fill("Mobile QA")
            page.wait_for_function("JSON.parse(localStorage.getItem('blank:draft') || '{}').name === 'Mobile QA'", timeout=10000)
            page.reload(wait_until="domcontentloaded")
            page.locator(".dock").wait_for(state="visible")
            page.wait_for_function("document.querySelector('textarea[aria-label=Name]')?.value === 'Mobile QA'", timeout=12000)
            assert page.locator("[id^=section-]").count() >= 1, "New block not persisted"
            print(f"PASS mobile shelf, insertion, editing and reload at {width}")

        if width == 390:
            # Import suggestions are deliberately opt-in, and this mock keeps
            # a user profile and rate limits out of the CI environment.
            repos = [
                {"owner":{"login":"demoauthor"},"language":"Python","fork":False,"archived":False},
                {"owner":{"login":"demoauthor"},"language":"TypeScript","fork":False,"archived":False},
                {"owner":{"login":"demoauthor"},"language":"Rust","fork":False,"archived":False},
                {"owner":{"login":"demoauthor"},"language":"Python","fork":False,"archived":False},
                {"owner":{"login":"demoauthor"},"language":"Go","fork":True,"archived":False},
                {"owner":{"login":"another"},"language":"Ruby","fork":False,"archived":False}
            ]
            page.route("**/users/demoauthor/repos?**",
                lambda route: route.fulfill(
                    status=200,content_type="application/json",body=json.dumps(repos)
                ))
            page.get_by_role("button", name="Import languages or browse suggestions").click()
            page.get_by_role("textbox", name="GitHub username").fill("demoauthor")
            page.get_by_role("button", name="Find languages").click()
            add_import = page.get_by_role("button", name="Add 3 new languages")
            add_import.wait_for(state="visible", timeout=12000)
            add_import.click()
            page.locator(".pf-reel-preview .pf-skill-reel.is-moving").wait_for(state="visible")
            assert page.locator(".pf-reel-preview .pf-reel-badge").count() == 6
            skills = page.evaluate("JSON.parse(localStorage.getItem('blank:draft')).skills")
            assert skills == ["Python","Rust","TypeScript"], f"Unexpected imported languages: {skills}"
            icon_hrefs = page.locator(".pf-reel-preview .pf-language-icon use").evaluate_all(
                "(els) => els.map(el=>el.getAttribute('href'))"
            )
            assert len(icon_hrefs) >= 3, f"Missing local SVG language icons: {icon_hrefs}"
            assert any("lang-python" in (x or "") for x in icon_hrefs)
            sprite = context.request.get(BASE + "/icons/languages-core.svg")
            assert sprite.status == 200 and 'id="lang-python"' in sprite.text(), "Local Devicon symbols unavailable"
            page.screenshot(path=str(OUT / "skills-editor-390.png"))
            page.get_by_role("button", name="Preview portfolio").click()
            rail = page.locator(".pf-skills .pf-skill-reel.is-moving")
            rail.wait_for(state="visible")
            rail.screenshot(path=str(OUT / "skills-visitor-390.png"))
            page.emulate_media(reduced_motion="reduce")
            assert page.locator(".pf-skills .pf-reel-track").evaluate(
                "(e)=>getComputedStyle(e).animationName"
            ) == "none", "Reduced-motion preference ignored"
            assert page.evaluate("document.documentElement.scrollWidth") <= width + 2
            print("PASS mocked GitHub language import, published-look rail and reduced motion")


        if width == 1440:
            page.get_by_role("textbox", name="Name").fill("Alex Morgan")
            page.get_by_placeholder("Designer, developer, artist…").fill("Creative engineer")
            page.get_by_role("textbox", name="Tagline").fill("Making digital things worth feeling.")
            page.get_by_role("button", name="Customise your portfolio").click()
            looks = {
                "classic":"Original", "editorial":"Editorial",
                "glass":"Liquid", "brutal":"Brutal",
                "aero":"Aero", "print":"Print",
                "neo":"Digital", "playful":"Playground",
            }
            for look,label in looks.items():
                page.get_by_role("button", name=label + " expression").click()
                assert page.locator(".app").get_attribute("data-look") == look
                assert page.get_by_role("textbox", name="Name").input_value() == "Alex Morgan", "Look switch erased content"
                assert page.evaluate("document.documentElement.scrollWidth") <= width + 2, f"Overflow in {look}"
                page.screenshot(path=str(OUT / f"look-{look}-1440.png"))
            page.get_by_role("button", name="Customise your portfolio").click()
            print("PASS eight looks, retained content, and horizontal overflow checks")

        assert not errors, f"Uncaught browser errors at {width}: {errors}"
        context.close()
    browser.close()
print("PASS actual React route / browser smoke checks")
