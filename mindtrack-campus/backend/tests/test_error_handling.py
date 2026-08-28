from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_unknown_route_returns_envelope_with_404():
    response = client.get("/this-route-does-not-exist")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert "message" in body["error"]


def test_missing_auth_header_returns_envelope_with_401():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "UNAUTHORIZED"
    assert "message" in body["error"]