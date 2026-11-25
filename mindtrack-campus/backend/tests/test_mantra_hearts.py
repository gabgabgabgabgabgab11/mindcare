from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session

from app.models.mantra_wall import MantraWallPost, MantraWallHeart
from app.services.mantra_wall_repository import get_heart_summaries, set_post_heart, moderate_post, list_visible_posts


@pytest.fixture
def wall():
    # Real SQL persistence in a disposable local database, never production.
    engine = create_engine("sqlite://")
    MantraWallPost.__table__.create(engine)
    MantraWallHeart.__table__.create(engine)
    post_id, author, student = uuid4(), uuid4(), uuid4()
    with Session(engine) as db:
        db.add(MantraWallPost(id=post_id, user_id=author, post_type="win", content="Finished my assignment", moderation_status="approved", created_at=datetime.now(timezone.utc)))
        db.commit()
    yield engine, post_id, author, student
    engine.dispose()


def test_heart_persists_after_session_reload(wall):
    engine, post_id, _, student = wall
    with Session(engine) as db:
        assert set_post_heart(db, post_id, student, True) == {"heart_count": 1, "has_sent_heart": True}
    with Session(engine) as db:
        assert get_heart_summaries(db, [post_id], student)[post_id] == {"heart_count": 1, "has_sent_heart": True}


def test_repeated_save_is_idempotent_and_count_is_shared(wall):
    engine, post_id, author, student = wall
    with Session(engine) as db:
        set_post_heart(db, post_id, student, True)
        set_post_heart(db, post_id, student, True)
        assert db.scalar(select(func.count()).select_from(MantraWallHeart)) == 1
        assert get_heart_summaries(db, [post_id], author)[post_id] == {"heart_count": 1, "has_sent_heart": False}
        assert set_post_heart(db, post_id, author, True)["heart_count"] == 2


def test_removing_heart_only_removes_the_current_accounts_heart(wall):
    engine, post_id, author, student = wall
    with Session(engine) as db:
        set_post_heart(db, post_id, author, True)
        set_post_heart(db, post_id, student, True)
        assert set_post_heart(db, post_id, student, False) == {"heart_count": 1, "has_sent_heart": False}
        assert set_post_heart(db, post_id, student, False)["heart_count"] == 1
        assert get_heart_summaries(db, [post_id], author)[post_id]["has_sent_heart"]


@pytest.mark.parametrize("status", ["review", "rejected", "archived", "pending"])
def test_unpublished_posts_cannot_receive_hearts(wall, status):
    engine, post_id, _, student = wall
    with Session(engine) as db:
        db.get(MantraWallPost, post_id).moderation_status = status
        db.commit()
        with pytest.raises(HTTPException) as error:
            set_post_heart(db, post_id, student, True)
        assert error.value.status_code == 404
        assert db.scalar(select(func.count()).select_from(MantraWallHeart)) == 0


def test_admin_can_approve_rejected_post_and_student_can_see_it(wall):
    engine, post_id, _, student = wall
    with Session(engine) as db:
        db.get(MantraWallPost, post_id).moderation_status = "rejected"
        db.commit()
        assert list_visible_posts(db, student) == []
        updated = moderate_post(db, post_id, uuid4(), "approved")
        assert updated.moderation_status == "approved"
        assert [post.id for post in list_visible_posts(db, student)] == [post_id]
