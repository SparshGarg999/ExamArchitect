from playwright.sync_api import sync_playwright

def inspect():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173")
        page.wait_for_timeout(2000)

        # Click on a category and enter dashboard
        page.locator('.category-card').first.click()
        page.wait_for_timeout(1000)
        page.get_by_role("button", name="Enter Dashboard").click()
        page.wait_for_timeout(2000)

        print("Page content after entering dashboard:")
        print(page.content())
        browser.close()

if __name__ == "__main__":
    inspect()
