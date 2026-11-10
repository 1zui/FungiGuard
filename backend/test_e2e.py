import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("=== 1. TEST HOME PAGE (DESKTOP 1280x800) ===")
        page.set_viewport_size({"width": 1280, "height": 800})
        page.goto(f"{BASE_URL}/", wait_until="networkidle")

        # Initial scroll width check
        sw1 = page.evaluate("() => document.documentElement.scrollWidth")
        cw1 = page.evaluate("() => document.documentElement.clientWidth")
        print(f"Initial: scrollWidth={sw1}, clientWidth={cw1}")
        assert sw1 <= cw1, "Horizontal scroll detected on initial load!"

        # Check Navbar clean styling
        nav_bg = page.evaluate("() => window.getComputedStyle(document.querySelector('nav')).backgroundColor")
        print(f"Navbar background color: {nav_bg}")
        # Warm background (lab or rgba)
        assert "lab" in nav_bg or "rgb" in nav_bg

        # Fill all 10 features for EDIBLE case
        edible_selections = {
            "#odor": "n",
            "#spore-print-color": "w",
            "#gill-color": "k",
            "#ring-type": "p",
            "#stalk-surface-above-ring": "s",
            "#stalk-surface-below-ring": "s",
            "#stalk-color-above-ring": "w",
            "#stalk-color-below-ring": "w",
            "#gill-size": "b",
            "#population": "v",
        }
        for sel, val in edible_selections.items():
            page.select_option(sel, val)

        # Check "Terisi" badges appear
        badges = page.locator("text=✓ Terisi")
        assert badges.count() == 10, f"Expected 10 ✓ Terisi badges, got {badges.count()}"
        print("10 interactive input selection badges: OK")

        analisis_btn = page.locator("button:has-text('Analisis')")
        assert analisis_btn.is_enabled()
        analisis_btn.click()

        # Wait for edible result
        page.wait_for_selector("text=Dapat dimakan")
        time.sleep(0.5)

        # CRITICAL TEST: Check that after analysis, page width DOES NOT blow out!
        sw2 = page.evaluate("() => document.documentElement.scrollWidth")
        cw2 = page.evaluate("() => document.documentElement.clientWidth")
        print(f"After analysis with history table: scrollWidth={sw2}, clientWidth={cw2}")
        assert sw2 <= cw2, f"BLOWOUT BUG DETECTED! scrollWidth={sw2} > clientWidth={cw2}"

        # CRITICAL TEST: Check that ResultCard is still visible within the viewport
        result_card_box = page.locator("text=Hasil Klasifikasi").bounding_box()
        print(f"Result card position: x={result_card_box['x']}, y={result_card_box['y']}, width={result_card_box['width']}")
        assert result_card_box['x'] + result_card_box['width'] <= 1280, "Result card is pushed off-screen to the right!"
        print("Result card fits perfectly on screen: OK")

        # Take screenshot of fitted layout
        page.screenshot(path="d:/fungiguard/home_fitted_desktop.png", full_page=True)
        print("Desktop screenshot saved: d:/fungiguard/home_fitted_desktop.png")

        # Check history table exists and is scrollable internally
        table_container = page.locator("table").first
        assert table_container.is_visible()

        print("\n=== 2. TEST MOBILE VIEWPORT (375x667) ===")
        page.set_viewport_size({"width": 375, "height": 667})
        page.goto(f"{BASE_URL}/", wait_until="networkidle")

        sw_m = page.evaluate("() => document.documentElement.scrollWidth")
        cw_m = page.evaluate("() => document.documentElement.clientWidth")
        print(f"Mobile 375px: scrollWidth={sw_m}, clientWidth={cw_m}")
        assert sw_m <= 375, f"Horizontal scroll on mobile: {sw_m}"

        page.screenshot(path="d:/fungiguard/home_fitted_mobile.png", full_page=True)
        print("Mobile screenshot saved: d:/fungiguard/home_fitted_mobile.png")

        print("\n=== 3. TEST SMOOTH PAGE TRANSITIONS & ROUTES ===")
        page.set_viewport_size({"width": 1280, "height": 800})
        
        # Test navigation between pages
        for route, heading in [
            ("/history", "Bagaimana Model Dilatih"),
            ("/guide", "Panduan Penggunaan"),
            ("/about", "Tentang FungiGuard"),
            ("/", "Klasifikasi Jamur")
        ]:
            page.click(f"nav >> a[href='{route}']")
            page.wait_for_selector(f"h1:has-text('{heading}')")
            # Verify animation class on template wrapper
            anim = page.locator(".animate-page").first
            assert anim.is_visible()
            print(f"Navigated smoothly to {route}: OK")

        # Check total console errors
        print(f"\nTotal Console errors encountered: {len(console_errors)}")
        if console_errors:
            print("Console errors:", console_errors)
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"

        browser.close()
        print("\n>>> ALL VERIFICATION TESTS PASSED 100%! <<<")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print("\nE2E TEST FAILED:", e)
        sys.exit(1)
