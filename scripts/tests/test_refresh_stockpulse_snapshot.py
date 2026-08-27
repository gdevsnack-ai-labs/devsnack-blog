import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import refresh_stockpulse_snapshot as snapshot  # noqa: E402


LATEST = {
    "posts": [
        {
            "slug": "2026-08-27",
            "title": "2026-08-27 오늘의 주식 예측 - 코스피 6800선 회복",
        }
    ]
}


class FakeResponse:
    def __init__(self, body):
        self.body = body.encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self.body


def test_verify_production_snapshot_accepts_latest_title(monkeypatch):
    monkeypatch.setattr(
        snapshot,
        "urlopen",
        lambda request, timeout: FakeResponse(
            '<h3>2026-08-27 오늘의 주식 예측 - 코스피 6800선 회복</h3>'
        ),
    )

    assert snapshot.verify_production_snapshot(LATEST, timeout_seconds=0) is None


def test_verify_production_snapshot_rejects_stale_static_page(monkeypatch):
    monkeypatch.setattr(
        snapshot,
        "urlopen",
        lambda request, timeout: FakeResponse('<h3>2026-08-26 이전 글</h3>'),
    )

    with pytest.raises(RuntimeError, match="production StockPulse list did not reflect"):
        snapshot.verify_production_snapshot(LATEST, timeout_seconds=0)
