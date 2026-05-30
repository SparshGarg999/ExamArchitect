import os
import re

file_path = "/Users/tanmaygarg/Documents/node/ExamArchitect/backend/parse_and_ingest_all.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import argparse and UPSC_CSE_TAXONOMY
content = content.replace("import random\n# pyrefly", "import random\nimport argparse\n# pyrefly")
content = content.replace("from app.analytics import AnalyticsEngine", "from app.analytics import AnalyticsEngine\nfrom app.init_db import UPSC_CSE_TAXONOMY")

# 2. Add UPSC PDF Mapping
upsc_mapping = """
UPSC_PDF_MAPPING = {
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2015.pdf": {"year": 2015, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2016.pdf": {"year": 2016, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2017.pdf": {"year": 2017, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2018.pdf": {"year": 2018, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2019.pdf": {"year": 2019, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2020.pdf": {"year": 2020, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2021.pdf": {"year": 2021, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2022.pdf": {"year": 2022, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2023.pdf": {"year": 2023, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2024.pdf": {"year": 2024, "session": "1"},
    "UPSC/UPSC-CSE/UPSC-CSE-Prelims-2025.pdf": {"year": 2025, "session": "1"},
}
"""
content = content.replace("PDF_MAPPING = {", "GATE_PDF_MAPPING = {")
content = re.sub(r'(SKIP_FITZ = {.*?})', r'\1\n' + upsc_mapping, content, flags=re.DOTALL)

# 3. Add UPSC Keywords and typical distribution
upsc_subjects = """
UPSC_SUBJECTS_KEYWORDS = {
    "History": ["ancient", "medieval", "modern", "gandhi", "congress", "buddha", "jain", "mughal", "maurya", "gupta", "art", "culture", "architecture", "freedom", "revolt", "act"],
    "Geography": ["river", "mountain", "climate", "soil", "crop", "earthquake", "volcano", "ocean", "current", "monsoon", "plateau", "forest", "national park", "map", "latitude", "longitude"],
    "Polity": ["constitution", "president", "parliament", "fundamental right", "directive principle", "supreme court", "high court", "panchayat", "amendment", "article", "governor", "election", "commission", "lok sabha"],
    "Economy": ["gdp", "inflation", "rbi", "bank", "repo rate", "budget", "tax", "wto", "imf", "world bank", "fdi", "rupee", "currency", "deficit", "agriculture", "industry", "poverty", "unemployment"],
    "Environment": ["ecology", "biodiversity", "climate change", "pollution", "carbon", "greenhouse", "ozone", "wildlife", "sanctuary", "tiger reserve", "wetland", "ramsar", "cites", "iucn", "species", "anthropogenic", "methane", "nitrous"],
    "Science": ["physics", "chemistry", "biology", "space", "satellite", "missile", "disease", "virus", "bacteria", "gene", "dna", "it", "communication", "computer", "internet", "nanotechnology", "biotechnology"],
    "Current Affairs": ["recent", "scheme", "yojana", "summit", "index", "report", "award", "committee", "portal", "app"]
}

UPSC_TYPICAL_DISTRIBUTION = {
    "History": (15, 15),
    "Geography": (15, 15),
    "Polity": (15, 15),
    "Economy": (15, 15),
    "Environment": (15, 15),
    "Science": (10, 10),
    "Current Affairs": (15, 15)
}
"""
content = content.replace("TYPICAL_DISTRIBUTION = {", "GATE_TYPICAL_DISTRIBUTION = {")
content = re.sub(r'("General Aptitude": \["General Aptitude"\]\n    }\n})', r'\1\n' + upsc_subjects, content, flags=re.DOTALL)

# 4. Modify extract_questions_from_text
new_extract = """def extract_questions_from_text(full_text: str, exam: str = "GATE-CS") -> list:
    \"\"\"Split full PDF text into individual questions using regex.\"\"\"
    if exam == "UPSC-CSE":
        # Match lines like "21. ", "1. "
        patterns = [
            r'(?:^|\\n)\\s*(\\d+)\\.\\s+'
        ]
    else:
        patterns = [
            r'(?:^|\\n)\\s*Q\\.\\s*(\\d+)',
            r'(?:^|\\n)\\s*Q(\\d+)\\b',
            r'(?:^|\\n)\\s*Question\\s*(?:No\\.?)?\\s*(\\d+)',
        ]
"""
content = re.sub(r'def extract_questions_from_text\(full_text: str\) -> list:.*?        \]', new_extract, content, flags=re.DOTALL)

# 5. Modify classify_question
new_classify = """def classify_question(q_text: str, q_num: int, year: int, exam: str = "GATE-CS") -> dict:
    \"\"\"Classify a question into subject/chapter using keyword matching.\"\"\"
    q_lower = q_text.lower()
    best_subject, best_chapter, best_score = None, None, 0

    if exam == "UPSC-CSE":
        for subject, keywords in UPSC_SUBJECTS_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in q_lower)
            if score > best_score:
                best_score = score
                best_subject = subject
                if subject in UPSC_CSE_TAXONOMY and UPSC_CSE_TAXONOMY[subject]:
                    best_chapter = random.choice(UPSC_CSE_TAXONOMY[subject])
                
        if not best_subject:
            best_subject = random.choice(list(UPSC_CSE_TAXONOMY.keys()))
            best_chapter = random.choice(UPSC_CSE_TAXONOMY[best_subject])
            
        marks = 2.0
        style = "MCQ"
        correct_ans = ["a", "b", "c", "d"][q_num % 4]
        difficulty = "M"

    else:
        for subject, info in GATE_SUBJECTS.items():
            score = sum(1 for kw in info["keywords"] if kw in q_lower)
            if score > best_score:
                best_score = score
                best_subject = subject
                best_chapter = random.choice(info["chapters"])

        if not best_subject:
            cs_subjects = [s for s in GATE_SUBJECTS if s != "General Aptitude"]
            best_subject = "General Aptitude" if q_num <= 10 else random.choice(cs_subjects)
            best_chapter = random.choice(GATE_SUBJECTS[best_subject]["chapters"])

        marks = 1.0 if q_num <= (30 if year < 2010 else 25) else 2.0
        
        has_options = (
            all(marker in q_text for marker in ["(A)", "(B)", "(C)", "(D)"]) or
            all(marker in q_text for marker in ["(a)", "(b)", "(c)", "(d)"]) or
            all(re.search(r'\\b' + marker + r'\\.', q_text) for marker in ["A", "B", "C", "D"]) or
            all(re.search(r'\\b' + marker + r'\\.', q_text) for marker in ["a", "b", "c", "d"])
        )

        style = "MCQ"
        if any(kw in q_lower for kw in ["numerical answer", "nat", "the value is", "___"]):
            style = "NAT"
            
        if has_options:
            style = "MCQ"

        word_count = len(q_text.split())
        difficulty = "H" if word_count > 200 else ("M" if word_count > 80 else "E")

        correct_ans = None
        if style == "MCQ":
            correct_ans = ["A", "B", "C", "D"][q_num % 4]
        elif style == "MSQ":
            correct_ans = [", ".join(["A", "C"]), ", ".join(["B", "D"]), ", ".join(["A", "B", "C"]), "A, B, C, D"][q_num % 4]
        elif style == "NAT":
            correct_ans = str((q_num * 7) % 100 + 5)"""
content = re.sub(r'def classify_question\(q_text: str, q_num: int, year: int\) -> dict:.*?            correct_ans = str\(\(q_num \* 7\) % 100 \+ 5\)', new_classify, content, flags=re.DOTALL)

# 6. Modify generate_synthetic
new_generate = """def generate_synthetic(year: int, existing_q_nums: set = None, target_count: int = 65, exam: str = "GATE-CS") -> list:
    \"\"\"Generate synthetic questions following the typical marks distribution.\"\"\"
    if existing_q_nums is None:
        existing_q_nums = set()

    questions = []
    q_num = 1
    
    dist = UPSC_TYPICAL_DISTRIBUTION if exam == "UPSC-CSE" else GATE_TYPICAL_DISTRIBUTION

    for subject, (marks_alloc, q_count) in dist.items():
        actual_count = max(1, q_count + random.randint(-1, 1))
        
        if exam == "UPSC-CSE":
            chapters = UPSC_CSE_TAXONOMY[subject]
        else:
            chapters = GATE_SUBJECTS[subject]["chapters"]

        for _ in range(actual_count):
            while q_num in existing_q_nums:
                q_num += 1
            if q_num > target_count:
                break

            chapter = random.choice(chapters)
            if exam == "UPSC-CSE":
                marks = 2.0
                q_style = "MCQ"
                correct = random.choice(["a", "b", "c", "d"])
                options_str = f"\\n(a) Option A\\n(b) Option B\\n(c) Option C\\n(d) Option D"
            else:
                marks = 1.0 if q_num <= (30 if year < 2010 else 25) else 2.0
                q_style = random.choice(["MCQ", "MCQ", "MCQ", "NAT"]) if year >= 2014 else "MCQ"
                correct = None
                options_str = ""
                if q_style == "MCQ":
                    correct = random.choice(["A", "B", "C", "D"])
                    options_str = f"\\n(A) Standard option A for {subject}\\n(B) Alternative option B in {chapter}\\n(C) Ideal response option C\\n(D) Fallback option D"
                elif q_style == "NAT":
                    correct = str(random.randint(5, 120))

            questions.append({
                "question_number": q_num,
                "question_text": f"[{exam} {year} Q{q_num}] {subject} ({chapter}). What is the correct answer regarding this topic?{options_str}",
                "marks": marks,
                "question_style": q_style,
                "correct_answer": correct,
                "has_diagram": False,
                "suggested_subject": subject,
                "suggested_chapter": chapter,
                "difficulty": random.choice(["E", "M", "H"])
            })
            q_num += 1

        if q_num > target_count:
            break

    return questions"""
content = re.sub(r'def generate_synthetic\(year: int, existing_q_nums: set = None, target_count: int = 65\) -> list:.*?    return questions', new_generate, content, flags=re.DOTALL)

# 7. Modify main
new_main = """def main():
    parser = argparse.ArgumentParser(description="Bulk Ingestion Pipeline")
    parser.add_argument("--exam", type=str, default="GATE-CS", choices=["GATE-CS", "UPSC-CSE"], help="Exam to ingest")
    args = parser.parse_args()
    
    exam_name = args.exam
    
    db = SessionLocal()
    try:
        exam_obj = db.query(Exam).filter_by(name=exam_name).first()
        if not exam_obj:
            print(f"ERROR: {exam_name} exam not found. Run the backend server first.")
            return

        print("=" * 60)
        print(f"ExamArchitect Bulk Ingestion Pipeline v5 - {exam_name}")
        print("=" * 60)

        print("\\nCleaning database...")
        db.query(Prediction).filter_by(exam_id=exam_obj.id).delete()
        db.query(TopicYearStat).filter_by(exam_id=exam_obj.id).delete()
        db.query(Question).filter(
            Question.paper_id.in_(db.query(Paper.id).filter_by(exam_id=exam_obj.id))
        ).delete(synchronize_session='fetch')
        db.query(Paper).filter_by(exam_id=exam_obj.id).delete()
        db.commit()
        print("Done.\\n")

        total_papers = 0
        total_questions = 0
        real_extractions = 0
        
        pdf_map = UPSC_PDF_MAPPING if exam_name == "UPSC-CSE" else GATE_PDF_MAPPING
        default_target = 100 if exam_name == "UPSC-CSE" else 65

        for pdf_name, details in sorted(pdf_map.items(), key=lambda x: x[1]["year"]):
            pdf_path = PDF_DIR / pdf_name
            year = details["year"]
            session = details["session"]
            
            if exam_name == "GATE-CS":
                target_q = 85 if year <= 2013 else 65
            else:
                target_q = 100

            if not pdf_path.exists():
                print(f"  [{year}] SKIP - {pdf_name} not found")
                continue

            print(f"  [{year}] {pdf_name}...", end=" ", flush=True)

            paper = Paper(
                exam_id=exam_obj.id, year=year, session=session,
                total_marks=200.0 if exam_name == "UPSC-CSE" else 100.0, 
                total_questions=target_q,
                is_processed=True, pdf_path=str(pdf_path.resolve())
            )
            db.add(paper)
            db.commit()
            db.refresh(paper)

            parsed_qs = []
            if pdf_name not in SKIP_FITZ:
                text = extract_text_direct(str(pdf_path.resolve()))
                if text and len(text.strip()) > 200:
                    parsed_qs = extract_questions_from_text(text, exam=exam_name)

            real_q_nums = set()
            ingested_from_text = 0

            if len(parsed_qs) >= 15:
                real_extractions += 1
                for idx, pq in enumerate(parsed_qs):
                    seq_num = pq["q_num"]
                    pq["text"] = clean_math_text(pq["text"])
                    tag = classify_question(pq["text"], seq_num, year, exam=exam_name)
                    ingest_question(db=db, paper_id=paper.id, parsed_data=tag)
                    real_q_nums.add(seq_num)
                    total_questions += 1
                    ingested_from_text += 1

            remaining = target_q - ingested_from_text
            if remaining > 0:
                synthetic = generate_synthetic(year, existing_q_nums=real_q_nums, target_count=target_q, exam=exam_name)
                added = 0
                for sq in synthetic:
                    if added >= remaining:
                        break
                    if sq["question_number"] not in real_q_nums:
                        ingest_question(db=db, paper_id=paper.id, parsed_data=sq)
                        total_questions += 1
                        added += 1

            recompute_topic_stats(db, exam_obj.id, year)
            total_papers += 1

            if ingested_from_text > 0:
                print(f"Extracted {ingested_from_text} + padded to {target_q} Qs")
            else:
                print(f"Synthetic ({target_q} Qs)")

        print(f"\\n  Total: {total_papers} papers, {total_questions} questions")
        print(f"  Real text extractions: {real_extractions}/{total_papers}")

        print(f"\\nGenerating AI Predictions for 2026 {exam_name}...")
        analytics = AnalyticsEngine(db)
        preds = analytics.generate_predictions(exam_obj.id)
        print(f"  Generated {len(preds)} predictions.")

        print("\\n" + "=" * 60)
        print("INGESTION COMPLETE!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        import traceback
        print(f"\\nFATAL ERROR: {e}")
        traceback.print_exc()
    finally:
        db.close()"""
content = re.sub(r'def main\(\):.*?    finally:\n        db.close\(\)', new_main, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
