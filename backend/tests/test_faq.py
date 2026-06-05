"""Tests for FAQ public endpoint."""


def test_public_faq_returns_only_published(client, db):
    from app.models.faq import FAQ
    from app.models.enums import FaqStatus

    # Insert a draft and a published FAQ directly
    db.add(FAQ(question="Published Q?", answer="A", status=FaqStatus.published))
    db.add(FAQ(question="Draft Q?", answer="A", status=FaqStatus.draft))
    db.commit()

    res = client.get("/api/v1/faqs")
    assert res.status_code == 200
    questions = [f["question"] for f in res.json()]
    assert "Published Q?" in questions
    assert "Draft Q?" not in questions
