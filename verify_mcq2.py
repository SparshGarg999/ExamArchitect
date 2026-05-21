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
            page.wait_for_load_state("networkidle")

            print("Looking for Enter Dashboard button...")
            enter_btn = page.locator("text='Enter Dashboard'")
            enter_btn.wait_for(state="visible", timeout=10000)
            enter_btn.click()

            print("Waiting for dashboard tabs...")
            page.wait_for_selector("text='Question Browser'", timeout=10000)

            print("Clicking Question Browser...")
            page.locator("text='Question Browser'").click()

            print("Waiting for paper card...")
            page.wait_for_selector(".paper-card", timeout=10000)

            print("Clicking first paper...")
            page.locator(".paper-card").first.click()

            print("Waiting for question cards...")
            page.wait_for_selector(".question-card", timeout=10000)
            page.screenshot(path="/home/jules/verification/screenshots/questions_unrevealed.png")

            print("Clicking a question option...")
            opt = page.locator(".question-option-card").first
            opt.click()

            page.screenshot(path="/home/jules/verification/screenshots/questions_selected.png")

            print("Clicking Show Answer...")
            show_btn = page.locator("button:has-text('Show Answer')").first
            show_btn.click()

            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/screenshots/questions_revealed.png")
            print("Success! Details captured.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/screenshots/error_state.png")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()
