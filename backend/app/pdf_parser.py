import os
import re
import fitz  # PyMuPDF
from pathlib import Path
from typing import List, Dict, Optional
import json

DATA_DIR = Path(os.path.dirname(os.path.dirname(__file__))) / "data"
SLICES_DIR = DATA_DIR / "slices"

# Create directories if they don't exist
SLICES_DIR.mkdir(parents=True, exist_ok=True)

class PDFParser:
    def __init__(self):
        self.question_regex = re.compile(r"(?:Q\.\s*\d+|Question\s*(?:No\.)?\s*\d+)")

    def parse_pdf(self, pdf_path: str, paper_id: int) -> List[Dict]:
        """
        Parses a past paper PDF and crops individual questions into image slices.
        """
        results = []
        try:
            doc = fitz.open(pdf_path)
        except Exception as e:
            print(f"Error opening PDF: {e}")
            return results

        paper_slices_dir = SLICES_DIR / str(paper_id)
        paper_slices_dir.mkdir(parents=True, exist_ok=True)

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text_blocks = page.get_text("dict")["blocks"]

            questions_on_page = []

            for block in text_blocks:
                if "lines" not in block:
                    continue
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        if self.question_regex.match(text):
                            # Found a question start
                            q_num_match = re.search(r"\d+", text)
                            q_num = int(q_num_match.group()) if q_num_match else len(questions_on_page) + 1
                            bbox = span["bbox"]
                            questions_on_page.append({
                                "q_num": q_num,
                                "start_y": bbox[1],
                                "page_num": page_num
                            })

            # Calculate end_y for each question on the page
            for i, q in enumerate(questions_on_page):
                if i < len(questions_on_page) - 1:
                    q["end_y"] = questions_on_page[i+1]["start_y"] - 5 # Give a small buffer
                else:
                    q["end_y"] = page.rect.height - 50 # Until bottom margin

                y0 = max(0, q["start_y"] - 10)
                y1 = min(page.rect.height, q["end_y"])
                if y1 <= y0:
                    y1 = y0 + 100 # Safe default fallback height
                rect = fitz.Rect(0, y0, page.rect.width, y1)
                
                # Render the image slice
                pix = page.get_pixmap(clip=rect, dpi=150)
                image_path = paper_slices_dir / f"q_{q['q_num']}.png"
                pix.save(str(image_path))

                results.append({
                    "paper_id": paper_id,
                    "question_number": q["q_num"],
                    "image_path": str(image_path),
                    "page_number": page_num + 1
                })
        
        doc.close()
        return results

class IngestSimulator:
    """
    Fallback simulator to provide mock questions if no PDFs are uploaded.
    This ensures the rest of the pipeline works out of the box.
    """
    @staticmethod
    def generate_mock_questions(paper_id: int, count: int = 5) -> List[Dict]:
        mock_data = []
        paper_slices_dir = SLICES_DIR / str(paper_id)
        paper_slices_dir.mkdir(parents=True, exist_ok=True)

        for i in range(1, count + 1):
            # Create a dummy blank image for the simulator
            image_path = paper_slices_dir / f"simulated_q_{i}.png"
            # Just create an empty file to represent the image
            with open(image_path, "wb") as f:
                f.write(b"")

            mock_data.append({
                "paper_id": paper_id,
                "question_number": i,
                "image_path": str(image_path),
                "is_simulated": True
            })
        return mock_data

if __name__ == "__main__":
    # Test Simulator
    sim = IngestSimulator()
    print(sim.generate_mock_questions(1, 2))
