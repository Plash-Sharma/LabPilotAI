import uuid
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_db
from app.main import app
from app.models import MCQAttempt, MCQQuestion, MCQTest, Submission, User

client = TestClient(app, raise_server_exceptions=False)

mock_user_id = uuid.uuid4()
mock_user = User(
    id=mock_user_id,
    email="student@college.edu",
    name="Test Student",
    college="NIT Jalandhar",
    password_hash="hash",
)

mock_sub_id = uuid.uuid4()
mock_submission = Submission(
    id=mock_sub_id,
    user_id=mock_user_id,
    template_id=uuid.uuid4(),
    aim="Implement Operator Overloading in C++",
    algorithm="Define class, overload operator++, display results",
    code="class Counter { int val; public: void operator++() { val++; } };",
    output="Count: 1\nCount: 2",
    result="Successfully overloaded increment operator",
    subject_of_lab="Object Oriented Programming",
    filename="lab_oops_01",
    status="ready",
)


class MockDB:
    def __init__(self):
        self.tests = {}
        self.questions = {}
        self.attempts = {}

    async def get(self, model, ident):
        if model == Submission and ident == mock_sub_id:
            return mock_submission
        if model == MCQTest:
            return self.tests.get(ident)
        if model == MCQAttempt:
            return self.attempts.get(ident)
        return None

    async def execute(self, stmt):
        stmt_str = str(stmt).lower()
        data = []
        if "from mcq_tests" in stmt_str or "mcq_tests." in stmt_str:
            data = list(self.tests.values())
        elif "from mcq_questions" in stmt_str or "mcq_questions." in stmt_str:
            data = list(self.questions.values())

        class MockResult:
            def __init__(self, data_list):
                self.data_list = data_list
            def all(self):
                return self.data_list
            def scalars(self):
                return self
            def scalar_one_or_none(self):
                return self.data_list[0] if self.data_list else None
        return MockResult(data)

    def add(self, entity):
        if isinstance(entity, MCQTest):
            if not hasattr(entity, "id") or entity.id is None:
                entity.id = uuid.uuid4()
            entity.created_at = datetime.utcnow()
            entity.questions = []
            entity.attempts = []
            self.tests[entity.id] = entity
        elif isinstance(entity, MCQQuestion):
            if not hasattr(entity, "id") or entity.id is None:
                entity.id = uuid.uuid4()
            self.questions[entity.id] = entity
            if entity.test_id in self.tests:
                self.tests[entity.test_id].questions.append(entity)
        elif isinstance(entity, MCQAttempt):
            if not hasattr(entity, "id") or entity.id is None:
                entity.id = uuid.uuid4()
            entity.created_at = datetime.utcnow()
            self.attempts[entity.id] = entity
            if entity.test_id in self.tests:
                self.tests[entity.test_id].attempts.append(entity)

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def refresh(self, entity, attribute_names=None):
        pass


@pytest.fixture(autouse=True)
def override_deps():
    mock_db = MockDB()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield mock_db
    app.dependency_overrides.clear()


def test_mcq_generation_endpoint(override_deps):
    """Test generating 10 to 15 questions for a submission."""
    response = client.post(
        f"/api/v1/submissions/{mock_sub_id}/mcq/generate",
        json={"num_questions": 12},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["total_questions"] == 12
    assert len(data["questions"]) == 12
    # Verify answers are hidden from student during test taking
    for q in data["questions"]:
        assert "question_text" in q
        assert len(q["options"]) == 4
        assert "correct_index" not in q  # must not leak answer!
        assert "explanation" not in q    # must not leak explanation before submit!


def test_mcq_submission_and_instant_grading(override_deps):
    """Test submitting test answers, on-the-spot score, and student level."""
    # 1. Generate test
    gen_res = client.post(
        f"/api/v1/submissions/{mock_sub_id}/mcq/generate",
        json={"num_questions": 10},
    )
    assert gen_res.status_code == 201
    test_id = gen_res.json()["id"]
    test_questions = gen_res.json()["questions"]

    # 2. Submit answers (answers all as option 0)
    answers = {q["id"]: 0 for q in test_questions}
    sub_res = client.post(
        f"/api/v1/mcq/tests/{test_id}/submit",
        json={"selected_answers": answers},
    )
    assert sub_res.status_code == 200
    res_data = sub_res.json()

    assert res_data["total_questions"] == 10
    assert "score" in res_data
    assert "percentage" in res_data
    assert "level" in res_data
    assert any(lvl in res_data["level"] for lvl in ["Mastery", "Proficient", "Intermediate", "Beginner"])
    assert "feedback" in res_data
    assert "analysis" in res_data
    assert len(res_data["questions"]) == 10

    # In results, explanations and correct answers are now revealed for learning
    first_q = res_data["questions"][0]
    assert "correct_index" in first_q
    assert "explanation" in first_q
    assert "is_correct" in first_q
