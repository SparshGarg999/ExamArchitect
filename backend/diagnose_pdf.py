import fitz
import re

pdf_path = "../pdfs/GATE-CS-2025-Set-1-Master-Question-Paper.pdf"
doc = fitz.open(pdf_path)

print("Total pages:", len(doc))
for page_num in range(min(5, len(doc))):
    page = doc.load_page(page_num)
    text = page.get_text()
    print(f"\n--- PAGE {page_num+1} TEXT (truncated) ---")
    print(text[:1000])

doc.close()
