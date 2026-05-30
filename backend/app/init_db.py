from .database import engine, SessionLocal, Base
from .models import ExamCategory, Exam, Topic, SyllabusVersion, SyllabusVersionTopic, User

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

# Subjects and their subtopics for UPSC CSE Prelims (GS Paper 1)
UPSC_CSE_TAXONOMY = {
    "History": [
        "Ancient India",
        "Medieval India",
        "Modern India & Indian National Movement",
        "Art and Culture"
    ],
    "Geography": [
        "Physical Geography",
        "Indian Geography",
        "World Geography",
        "Human & Economic Geography"
    ],
    "Polity": [
        "Constitution & Political System",
        "Panchayati Raj & Public Policy",
        "Rights Issues & Governance"
    ],
    "Economy": [
        "Economic & Social Development",
        "Sustainable Development",
        "Poverty, Inclusion & Demographics",
        "Social Sector Initiatives"
    ],
    "Environment": [
        "Ecology & Bio-diversity",
        "Climate Change & Environmental Issues"
    ],
    "Science": [
        "Physics & Space",
        "Chemistry",
        "Biology & Biotechnology",
        "IT & Communication"
    ],
    "Current Affairs": [
        "National Events",
        "International Events",
        "Government Schemes"
    ]
}

JEE_MAIN_TAXONOMY = {
    "Physics": [
        "Mechanics",
        "Electromagnetism",
        "Optics",
        "Modern Physics",
        "Thermodynamics",
        "Waves"
    ],
    "Chemistry": [
        "Physical Chemistry",
        "Organic Chemistry",
        "Inorganic Chemistry"
    ],
    "Mathematics": [
        "Algebra",
        "Calculus",
        "Coordinate Geometry",
        "Trigonometry",
        "Statistics & Probability",
        "Vector & 3D Geometry"
    ]
}

NEET_TAXONOMY = {
    "Physics": [
        "Units & Measurements",
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Laws of Motion",
        "Work, Energy and Power",
        "Rotation",
        "Gravitation",
        "Mechanical Properties of Solids",
        "Mechanical Properties of Fluids",
        "Thermal Properties of Matter",
        "Thermodynamics",
        "Kinetic Theory of Gases",
        "Oscillations",
        "Waves",
        "Electrostatics",
        "Current Electricity",
        "Magnetic Effects of Current",
        "Magnetism and Matter",
        "Electromagnetic Induction",
        "Alternating Current",
        "Electromagnetic Waves",
        "Ray Optics",
        "Wave Optics",
        "Dual Nature of Matter and Radiation",
        "Atoms",
        "Nuclei",
        "Semiconductors",
        "Communication Systems"
    ],
    "Chemistry": [
        "Some Basic Concepts of Chemistry",
        "Structure of Atom",
        "Classification of Elements & Periodicity",
        "Chemical Bonding & Molecular Structure",
        "States of Matter",
        "Thermodynamics",
        "Equilibrium",
        "Redox Reactions",
        "Hydrogen",
        "S-Block Elements",
        "P-Block Elements",
        "Organic Chemistry - Basic Principles",
        "Hydrocarbons",
        "Environmental Chemistry",
        "Solid State",
        "Solutions",
        "Electrochemistry",
        "Chemical Kinetics",
        "Surface Chemistry",
        "D & F-Block Elements",
        "Coordination Compounds",
        "Haloalkanes & Haloarenes",
        "Alcohols, Phenols & Ethers",
        "Aldehydes, Ketones & Carboxylic Acids",
        "Amines",
        "Biomolecules",
        "Polymers",
        "Chemistry in Everyday Life"
    ],
    "Botany": [
        "The Living World",
        "Biological Classification",
        "Plant Kingdom",
        "Morphology of Flowering Plants",
        "Anatomy of Flowering Plants",
        "Cell: The Unit of Life",
        "Cell Cycle and Cell Division",
        "Photosynthesis in Higher Plants",
        "Respiration in Plants",
        "Plant Growth and Development",
        "Transport in Plants",
        "Mineral Nutrition",
        "Sexual Reproduction in Flowering Plants",
        "Principles of Inheritance and Variation",
        "Molecular Basis of Inheritance",
        "Evolution",
        "Microbes in Human Welfare",
        "Biotechnology: Principles and Processes",
        "Biotechnology and its Applications",
        "Organisms and Populations",
        "Ecosystem",
        "Biodiversity and Conservation",
        "Environmental Issues"
    ],
    "Zoology": [
        "Animal Kingdom",
        "Structural Organisation in Animals",
        "Biomolecules",
        "Digestion and Absorption",
        "Breathing and Exchange of Gases",
        "Body Fluids and Circulation",
        "Excretory Products and their Elimination",
        "Locomotion and Movement",
        "Neural Control and Coordination",
        "Chemical Coordination and Integration",
        "Human Reproduction",
        "Reproductive Health",
        "Human Health and Disease",
        "Strategies for Enhancement in Food Production"
    ]
}

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 0. Seed Admin User
        admin_user = db.query(User).filter_by(email="admin@examarchitect.com").first()
        if not admin_user:
            from .auth import get_password_hash
            hashed_pw = get_password_hash("AdminPassword123!")
            admin_user = User(
                name="System Admin",
                email="admin@examarchitect.com",
                password_hash=hashed_pw,
                role="admin",
                requires_password_change=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        # 1. Seed Categories
        categories = {
            "Engineering": {"icon": "Cpu", "color": "#6366f1", "desc": "Technical exams focusing on core engineering principles and sciences."},
            "Medical": {"icon": "Stethoscope", "color": "#10b981", "desc": "Medical entrance and licensing examinations."},
            "UPSC": {"icon": "Landmark", "color": "#f59e0b", "desc": "Civil services and government recruitment examinations."},
            "Management": {"icon": "Briefcase", "color": "#8b5cf6", "desc": "Business and management aptitude tests."}
        }
        
        db_categories = {}
        for cat_name, data in categories.items():
            cat = db.query(ExamCategory).filter_by(name=cat_name).first()
            if not cat:
                cat = ExamCategory(
                    name=cat_name,
                    icon=data["icon"],
                    description=data["desc"],
                    color=data["color"]
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
            db_categories[cat_name] = cat
            
        # 2. Seed Exams
        exams_to_seed = [
            {"category": "Engineering", "name": "GATE-CS", "full_name": "Graduate Aptitude Test in Engineering - Computer Science(GATE-CS)", "conducting": "IISc & IITs", "freq": "Annual"},
            {"category": "Engineering", "name": "JEE-Main", "full_name": "Joint Entrance Examination - Main(JEE-Main)", "conducting": "NTA", "freq": "Twice a Year"},
            {"category": "Medical", "name": "NEET", "full_name": "National Eligibility cum Entrance Test(NEET)", "conducting": "NTA", "freq": "Annual"},
            {"category": "UPSC", "name": "UPSC-CSE", "full_name": "Civil Services Examination(UPSC-CSE)", "conducting": "UPSC", "freq": "Annual"}
        ]
        
        db_exams = {}
        for exam_data in exams_to_seed:
            exam = db.query(Exam).filter_by(name=exam_data["name"]).first()
            if not exam:
                exam = Exam(
                    category_id=db_categories[exam_data["category"]].id,
                    name=exam_data["name"],
                    full_name=exam_data["full_name"],
                    conducting_body=exam_data["conducting"],
                    frequency=exam_data["freq"]
                )
                db.add(exam)
                db.commit()
                db.refresh(exam)
            db_exams[exam_data["name"]] = exam
            
        gate_cs = db_exams["GATE-CS"]
        jee_main = db_exams["JEE-Main"]

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

        # Seed JEE-Main Topics
        jee_existing_topics = {t.name: t for t in db.query(Topic).filter_by(exam_id=jee_main.id).all()}
        
        jee_sv = db.query(SyllabusVersion).filter_by(exam_id=jee_main.id, version_name="JEE Main Base Syllabus").first()
        if not jee_sv:
            jee_sv = SyllabusVersion(
                exam_id=jee_main.id,
                version_name="JEE Main Base Syllabus",
                from_year=2014,
                to_year=None
            )
            db.add(jee_sv)
            db.commit()
            db.refresh(jee_sv)

        for subject, subtopics in JEE_MAIN_TAXONOMY.items():
            # Create parent subject topic
            parent_topic = jee_existing_topics.get(subject)
            if not parent_topic:
                parent_topic = Topic(
                    exam_id=jee_main.id,
                    name=subject,
                    parent_topic_id=None
                )
                db.add(parent_topic)
                db.commit()
                db.refresh(parent_topic)
                jee_existing_topics[subject] = parent_topic
                
            # Add to syllabus version
            sv_t = db.query(SyllabusVersionTopic).filter_by(version_id=jee_sv.id, topic_id=parent_topic.id).first()
            if not sv_t:
                db.add(SyllabusVersionTopic(version_id=jee_sv.id, topic_id=parent_topic.id, is_active=True))

            # Create child subtopics
            for subtopic_name in subtopics:
                subtopic = jee_existing_topics.get(subtopic_name)
                if not subtopic:
                    subtopic = Topic(
                        exam_id=jee_main.id,
                        name=subtopic_name,
                        parent_topic_id=parent_topic.id
                    )
                    db.add(subtopic)
                    db.commit()
                    db.refresh(subtopic)
                    jee_existing_topics[subtopic_name] = subtopic
                    
                # Add to syllabus version
                sv_sub_t = db.query(SyllabusVersionTopic).filter_by(version_id=jee_sv.id, topic_id=subtopic.id).first()
                if not sv_sub_t:
                    db.add(SyllabusVersionTopic(version_id=jee_sv.id, topic_id=subtopic.id, is_active=True))

        # 4. Seed Topics & Subtopics for UPSC-CSE
        upsc_cse = db_exams["UPSC-CSE"]
        existing_upsc_topics = {t.name: t for t in db.query(Topic).filter_by(exam_id=upsc_cse.id).all()}
        
        sv_upsc_2021 = db.query(SyllabusVersion).filter_by(exam_id=upsc_cse.id, version_name="2021 Syllabus").first()
        if not sv_upsc_2021:
            sv_upsc_2021 = SyllabusVersion(
                exam_id=upsc_cse.id,
                version_name="2021 Syllabus",
                from_year=2021,
                to_year=None # Current active syllabus
            )
            db.add(sv_upsc_2021)
            db.commit()
            db.refresh(sv_upsc_2021)

        for subject, subtopics in UPSC_CSE_TAXONOMY.items():
            parent_topic = existing_upsc_topics.get(subject)
            if not parent_topic:
                parent_topic = Topic(
                    exam_id=upsc_cse.id,
                    name=subject,
                    parent_topic_id=None
                )
                db.add(parent_topic)
                db.commit()
                db.refresh(parent_topic)
                existing_upsc_topics[subject] = parent_topic
                
            sv_t = db.query(SyllabusVersionTopic).filter_by(version_id=sv_upsc_2021.id, topic_id=parent_topic.id).first()
            if not sv_t:
                db.add(SyllabusVersionTopic(version_id=sv_upsc_2021.id, topic_id=parent_topic.id, is_active=True))

            for subtopic_name in subtopics:
                subtopic = existing_upsc_topics.get(subtopic_name)
                if not subtopic:
                    subtopic = Topic(
                        exam_id=upsc_cse.id,
                        name=subtopic_name,
                        parent_topic_id=parent_topic.id
                    )
                    db.add(subtopic)
                    db.commit()
                    db.refresh(subtopic)
                    existing_upsc_topics[subtopic_name] = subtopic
                    
                sv_sub_t = db.query(SyllabusVersionTopic).filter_by(version_id=sv_upsc_2021.id, topic_id=subtopic.id).first()
                if not sv_sub_t:
                    db.add(SyllabusVersionTopic(version_id=sv_upsc_2021.id, topic_id=subtopic.id, is_active=True))
                    
        # 5. Seed Topics & Subtopics for NEET
        neet_exam = db_exams.get("NEET")
        if neet_exam:
            existing_neet_topics = {t.name: t for t in db.query(Topic).filter_by(exam_id=neet_exam.id).all()}

            sv_neet = db.query(SyllabusVersion).filter_by(exam_id=neet_exam.id, version_name="NEET UG Base Syllabus").first()
            if not sv_neet:
                sv_neet = SyllabusVersion(
                    exam_id=neet_exam.id,
                    version_name="NEET UG Base Syllabus",
                    from_year=2013,
                    to_year=None
                )
                db.add(sv_neet)
                db.commit()
                db.refresh(sv_neet)

            for subject, subtopics in NEET_TAXONOMY.items():
                parent_topic = existing_neet_topics.get(subject)
                if not parent_topic:
                    parent_topic = Topic(
                        exam_id=neet_exam.id,
                        name=subject,
                        parent_topic_id=None
                    )
                    db.add(parent_topic)
                    db.commit()
                    db.refresh(parent_topic)
                    existing_neet_topics[subject] = parent_topic

                sv_t = db.query(SyllabusVersionTopic).filter_by(version_id=sv_neet.id, topic_id=parent_topic.id).first()
                if not sv_t:
                    db.add(SyllabusVersionTopic(version_id=sv_neet.id, topic_id=parent_topic.id, is_active=True))

                for subtopic_name in subtopics:
                    subtopic = existing_neet_topics.get(subtopic_name)
                    if not subtopic:
                        subtopic = Topic(
                            exam_id=neet_exam.id,
                            name=subtopic_name,
                            parent_topic_id=parent_topic.id
                        )
                        db.add(subtopic)
                        db.commit()
                        db.refresh(subtopic)
                        existing_neet_topics[subtopic_name] = subtopic

                    sv_sub_t = db.query(SyllabusVersionTopic).filter_by(version_id=sv_neet.id, topic_id=subtopic.id).first()
                    if not sv_sub_t:
                        db.add(SyllabusVersionTopic(version_id=sv_neet.id, topic_id=subtopic.id, is_active=True))

        db.commit()
        print("Database successfully seeded with categories, GATE CS, JEE-Main, UPSC-CSE and NEET taxonomy!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
