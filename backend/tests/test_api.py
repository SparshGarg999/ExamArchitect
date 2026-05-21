from fastapi.testclient import TestClient
from app.models import ExamCategory, Exam, Paper, Topic, Question

def test_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_categories(client: TestClient, db_session):
    cat = ExamCategory(name="Test Category")
    db_session.add(cat)
    db_session.commit()

    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(c["name"] == "Test Category" for c in data)

def test_get_exam(client: TestClient, db_session):
    cat = ExamCategory(name="Test Category")
    db_session.add(cat)
    db_session.commit()
    exam = Exam(category_id=cat.id, name="Test Exam", full_name="Test Full Exam Name")
    db_session.add(exam)
    db_session.commit()
    topic = Topic(exam_id=exam.id, name="Test Topic")
    db_session.add(topic)
    db_session.commit()

    response = client.get(f"/api/exams/{exam.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Exam"
    assert "topics" in response.json()
    assert len(response.json()["topics"]) > 0
    assert response.json()["topics"][0]["name"] == "Test Topic"

def test_get_heatmap(client: TestClient, db_session):
    cat = ExamCategory(name="Test Category")
    db_session.add(cat)
    db_session.commit()
    exam = Exam(category_id=cat.id, name="Test Exam", full_name="Test Full Exam Name")
    db_session.add(exam)
    db_session.commit()
    topic = Topic(exam_id=exam.id, name="Test Topic")
    db_session.add(topic)
    db_session.commit()

    response = client.get(f"/api/exams/{exam.id}/heatmap")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "years" in data

def test_get_paper_questions(client: TestClient, db_session):
    cat = ExamCategory(name="Test Category")
    db_session.add(cat)
    db_session.commit()
    exam = Exam(category_id=cat.id, name="Test Exam", full_name="Test Full Exam Name")
    db_session.add(exam)
    db_session.commit()
    paper = Paper(exam_id=exam.id, year=2021, session="Spring")
    db_session.add(paper)
    db_session.commit()

    response = client.get(f"/api/papers/{paper.id}/questions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_global_questions(client: TestClient, db_session):
    cat = ExamCategory(name="Test Category")
    db_session.add(cat)
    db_session.commit()
    exam = Exam(category_id=cat.id, name="Test Exam", full_name="Test Full Exam Name")
    db_session.add(exam)
    db_session.commit()
    paper = Paper(exam_id=exam.id, year=2021, session="Spring")
    db_session.add(paper)
    db_session.commit()
    topic = Topic(exam_id=exam.id, name="Test Topic")
    db_session.add(topic)
    db_session.commit()

    q = Question(paper_id=paper.id, topic_id=topic.id, question_number=1, question_text="What is a test?", marks=2, question_style="MCQ", difficulty="Medium")
    db_session.add(q)
    db_session.commit()

    response = client.get("/api/questions?search=test")
    assert response.status_code == 200
    assert len(response.json()) > 0
