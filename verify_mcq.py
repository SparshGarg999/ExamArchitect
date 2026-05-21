from playwright.sync_api import sync_playwright
import os

def run():
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/videos")
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173", timeout=30000)
            page.wait_for_timeout(5000)
            page.screenshot(path="/home/jules/verification/screenshots/initial.png")
            print("Screenshot saved to initial.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()
