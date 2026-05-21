from .database import engine, SessionLocal, Base
from .models import ExamCategory, Exam, Topic, SyllabusVersion, SyllabusVersionTopic

# Subjects and their subtopics for GATE CS
GATE_CS_TAXONOMY = {
    "Discrete Mathematics": [
        "Mathematical Logic",
        "Set Theory & Algebra",
        "Combinatorics",
        "Graph Theory"
    ],
    "Engineering Mathematics": [
        "Linear Algebra",
        "Calculus",
        "Probability & Statistics"
    ],
    "Digital Logic": [
        "Boolean Algebra & Minimization",
        "Number Representation & Arithmetic",
        "Combinational Circuits",
        "Sequential Circuits"
    ],
    "Computer Organization & Architecture": [
        "Machine Instructions & Addressing Modes",
        "ALU, Data-path & Control Unit",
        "Instruction Pipelining & Hazards",
        "Memory Hierarchy (Cache, Virtual Memory)",
        "I/O Interface & DMA"
    ],
    "Programming & Data Structures": [
        "Programming in C",
        "Recursion",
        "Arrays, Stacks, Queues & Linked Lists",
        "Trees & Binary Search Trees",
        "Binary Heaps",
        "Graphs Representation"
    ],
    "Algorithms": [
        "Asymptotic Complexity Analysis",
        "Searching, Sorting & Hashing",
        "Divide and Conquer, Greedy & Dynamic Programming",
        "Graph Traversals & Connectivity",
        "Minimum Spanning Trees & Shortest Paths"
    ],
    "Theory of Computation": [
        "Regular Expressions & Finite Automata",
        "Context-Free Grammars & Pushdown Automata",
        "Regular & Context-Free Languages (Pumping Lemma)",
        "Turing Machines & Undecidability"
    ],
    "Compiler Design": [
        "Lexical Analysis & Parsing",
        "Syntax-Directed Translation & Intermediate Code",
        "Code Optimization & Liveness Analysis"
    ],
    "Operating Systems": [
        "System Calls, Processes & Threads",
        "CPU Scheduling",
        "Inter-process Communication & Deadlocks",
        "Memory Management & Virtual Memory",
        "File Systems & Disk Scheduling"
    ],
    "Databases": [
        "ER-Model & Relational Model",
        "Relational Algebra & SQL",
        "Integrity Constraints & Normal Forms (1NF, 2NF, 3NF, BCNF)",
        "Transactions & Concurrency Control",
        "File Organization & Indexing (B/B+ Trees)"
    ],
    "Computer Networks": [
        "OSI & TCP/IP Protocol Stacks",
        "Flow and Error Control, LAN Technologies",
        "IP(v4) Addressing, Routing & Congestion Control",
        "TCP & UDP Protocols",
        "Sockets & Application Layer (HTTP, DNS, SMTP, FTP)"
    ]
}

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed Categories
        engineering = db.query(ExamCategory).filter_by(name="Engineering").first()
        if not engineering:
            engineering = ExamCategory(
                name="Engineering",
                icon="Cpu",
                description="Technical exams focusing on core engineering principles and sciences.",
                color="#6366f1" # Indigo
            )
            db.add(engineering)
            db.commit()
            db.refresh(engineering)
            
        # 2. Seed Exam
        gate_cs = db.query(Exam).filter_by(name="GATE-CS").first()
        if not gate_cs:
            gate_cs = Exam(
                category_id=engineering.id,
                name="GATE-CS",
                full_name="Graduate Aptitude Test in Engineering - Computer Science",
                conducting_body="IISc & IITs",
                frequency="Annual"
            )
            db.add(gate_cs)
            db.commit()
            db.refresh(gate_cs)

        # 3. Seed Topics & Subtopics
        existing_topics = {t.name: t for t in db.query(Topic).filter_by(exam_id=gate_cs.id).all()}
        
        # We will also create a syllabus version for "2021 Revision"
        sv_2021 = db.query(SyllabusVersion).filter_by(exam_id=gate_cs.id, version_name="2021 Revision").first()
        if not sv_2021:
            sv_2021 = SyllabusVersion(
                exam_id=gate_cs.id,
                version_name="2021 Revision",
                from_year=2021,
                to_year=None # Current active syllabus
            )
            db.add(sv_2021)
            db.commit()
            db.refresh(sv_2021)

        for subject, subtopics in GATE_CS_TAXONOMY.items():
            # Create parent subject topic
            parent_topic = existing_topics.get(subject)
            if not parent_topic:
                parent_topic = Topic(
                    exam_id=gate_cs.id,
                    name=subject,
                    parent_topic_id=None
                )
                db.add(parent_topic)
                db.commit()
                db.refresh(parent_topic)
                existing_topics[subject] = parent_topic
                
            # Add to syllabus version
            sv_t = db.query(SyllabusVersionTopic).filter_by(version_id=sv_2021.id, topic_id=parent_topic.id).first()
            if not sv_t:
                db.add(SyllabusVersionTopic(version_id=sv_2021.id, topic_id=parent_topic.id, is_active=True))

            # Create child subtopics
            for subtopic_name in subtopics:
                subtopic = existing_topics.get(subtopic_name)
                if not subtopic:
                    subtopic = Topic(
                        exam_id=gate_cs.id,
                        name=subtopic_name,
                        parent_topic_id=parent_topic.id
                    )
                    db.add(subtopic)
                    db.commit()
                    db.refresh(subtopic)
                    existing_topics[subtopic_name] = subtopic
                    
                # Add to syllabus version
                sv_sub_t = db.query(SyllabusVersionTopic).filter_by(version_id=sv_2021.id, topic_id=subtopic.id).first()
                if not sv_sub_t:
                    db.add(SyllabusVersionTopic(version_id=sv_2021.id, topic_id=subtopic.id, is_active=True))
                    
        db.commit()
        print("Database successfully seeded with categories and GATE CS taxonomy!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
