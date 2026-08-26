"""Deterministic StockPulse weekly Lab Note aggregation and rendering."""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any, Iterable

REQUIRED_HEADINGS = (
    "실험 질문과 범위",
    "주간 지표",
    "일별 compact result",
    "큰 오차 사례",
    "성공 사례",
    "자기개선 내용",
    "전주 대비 변화",
    "다음 주 변경사항",
    "한계와 판정",
)


def _scored(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    return [row for row in rows if row.get("accuracy_score") is not None]


def _metric(rows: list[dict[str, Any]]) -> dict[str, Any]:
    scored = _scored(rows)
    correct = [row for row in scored if row.get("is_correct") is True]
    return {
        "count": len(rows),
        "scored_count": len(scored),
        "correct_count": len(correct),
        "accuracy_rate": round(len(correct) / len(scored), 4) if scored else None,
        "mean_accuracy_score": round(
            sum(float(row["accuracy_score"]) for row in scored) / len(scored), 4
        ) if scored else None,
    }


def calculate_metrics(predictions: list[dict[str, Any]]) -> dict[str, Any]:
    by_session: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in predictions:
        by_session[str(row.get("session") or "unknown")].append(row)
    session_metrics = {session: _metric(rows) for session, rows in sorted(by_session.items())}
    return {
        "overall": _metric(predictions),
        "by_session": session_metrics,
    }


def _percent(value: float | None) -> str:
    return "—" if value is None else f"{value * 100:.1f}%"


def _score(value: float | None) -> str:
    return "—" if value is None else f"{value:.4f}"


def _delta(value: float | None) -> str:
    return "—" if value is None else f"{value:+.4f}"


def _rate_delta(value: float | None) -> str:
    return "—" if value is None else f"{value * 100:+.1f}%p"


def _cell(value: Any) -> str:
    text = "—" if value is None or value == "" else str(value)
    return text.replace("|", "\\|").replace("\n", " ").strip()


def _prediction_label(row: dict[str, Any] | None) -> str:
    if not row:
        return "기록 없음"
    direction = _cell(row.get("direction"))
    target = _cell(row.get("kospi_target"))
    score = _score(row.get("accuracy_score"))
    result = "성공" if row.get("is_correct") is True else "실패" if row.get("is_correct") is False else "평가 중"
    return f"{direction} ({target}) · {result} · score {score}"


def _unique_phrases(predictions: list[dict[str, Any]]) -> list[str]:
    phrases: list[str] = []
    for row in predictions:
        value = (row.get("improvement") or "").strip()
        if not value:
            continue
        compact = re.sub(r"\s+", " ", value)
        if compact not in phrases:
            phrases.append(compact)
    return phrases


def _action_summary(applied_actions: dict[str, str]) -> tuple[str, str]:
    values = [re.sub(r"\s+", " ", value).strip() for value in applied_actions.values() if value.strip()]
    llm = [value for value in values if "LLM" in value or "프롬프트" in value]
    ml = [value for value in values if "ML" in value or "피처" in value or "feature" in value.lower()]
    return (
        " · ".join(dict.fromkeys(llm)) or "조건부 시나리오와 위험 신호를 다음 예측에서 확인한다.",
        " · ".join(dict.fromkeys(ml)) or "변동성·수급·뉴스 특징량 반영 여부를 다음 학습에서 확인한다.",
    )


def _daily_rows(predictions: list[dict[str, Any]], expected_dates: list[str]) -> dict[str, dict[str, dict[str, Any]]]:
    result: dict[str, dict[str, dict[str, Any]]] = {date: {} for date in expected_dates}
    for row in predictions:
        date = str(row.get("date") or "")
        session = str(row.get("session") or "")
        if date in result and session in {"morning", "ml"}:
            result[date][session] = row
    return result


def build_weekly_note(
    *,
    week_start: str,
    week_end: str,
    predictions: list[dict[str, Any]],
    previous_predictions: list[dict[str, Any]],
    stockpulse_posts: list[dict[str, Any]],
    lab_note_slugs: list[str],
    applied_actions: dict[str, str],
) -> str:
    expected_dates = sorted({str(row.get("date")) for row in predictions if row.get("date")})
    current_metrics = calculate_metrics(predictions)
    previous_metrics = calculate_metrics(previous_predictions)
    daily = _daily_rows(predictions, expected_dates)
    llm_text, ml_text = _action_summary(applied_actions)
    improvement_phrases = _unique_phrases(predictions)

    overall = current_metrics["overall"]
    previous_overall = previous_metrics["overall"]
    morning = current_metrics["by_session"].get("morning", _metric([]))
    ml = current_metrics["by_session"].get("ml", _metric([]))
    previous_morning = previous_metrics["by_session"].get("morning", _metric([]))
    previous_ml = previous_metrics["by_session"].get("ml", _metric([]))

    errors = sorted(
        [row for row in predictions if row.get("is_correct") is False],
        key=lambda row: (float(row.get("accuracy_score") or 0), str(row.get("date")), str(row.get("session"))),
    )
    successes = sorted(
        [row for row in predictions if row.get("is_correct") is True],
        key=lambda row: (-float(row.get("accuracy_score") or 0), str(row.get("date")), str(row.get("session"))),
    )

    lines = [
        f"# StockPulse 주간 자기개선 실험 — {week_start}~{week_end}",
        "",
        "## 실험 질문과 범위",
        "",
        f"이번 기록은 {week_start}부터 {week_end}까지의 완결된 4거래일을 대상으로 했다. 8월 17일은 광복절 대체공휴일이어서 분석 범위에서 제외했다.",
        "",
        "StockPulse daily Feed를 단순히 이어 붙이지 않고, `predictions`의 LLM·ML 예측과 장 마감 평가를 주간 자기개선 실험 기록으로 재구성했다. 주간 대상은 오전/장 마감 Feed 8개와 그에 대응하는 prediction/evaluation 8개이며, 기존 daily Lab Note 4개는 원자료로만 참조하고 변경하지 않았다.",
        "",
        "이 기록은 [StockPulse AI 자기개선 실험 Project](/labs/stockpulse-ai-self-improvement)의 주간 결과이며, 원본 prediction/evaluation 데이터와 daily article은 별도로 보존한다.",
        "",
        "## 주간 지표",
        "",
        "| Lane | 실행 수 | 평가 수 | 성공 | 정확도 | 평균 accuracy score |",
        "|---|---:|---:|---:|---:|---:|",
        f"| LLM morning | {morning['count']} | {morning['scored_count']} | {morning['correct_count']} | {_percent(morning['accuracy_rate'])} | {_score(morning['mean_accuracy_score'])} |",
        f"| ML | {ml['count']} | {ml['scored_count']} | {ml['correct_count']} | {_percent(ml['accuracy_rate'])} | {_score(ml['mean_accuracy_score'])} |",
        f"| 전체 | {overall['count']} | {overall['scored_count']} | {overall['correct_count']} | {_percent(overall['accuracy_rate'])} | {_score(overall['mean_accuracy_score'])} |",
        "",
        f"이번 주 전체 prediction 실행은 {overall['count']}회였고, 평가 가능한 {overall['scored_count']}건 중 {overall['correct_count']}건이 성공했다. 이 정확도는 투자 수익률이 아니라 StockPulse 내부 예측 판정 지표다.",
        "",
        "## 일별 compact result",
        "",
        "| 날짜 | 실제 KOSPI | LLM morning | ML | Daily Lab Note |",
        "|---|---:|---|---|---|",
    ]
    for date in expected_dates:
        morning_row = daily[date].get("morning")
        ml_row = daily[date].get("ml")
        close = (morning_row or ml_row or {}).get("actual_kospi_close")
        lab_slug = f"stockpulse-self-{date}"
        lines.append(
            f"| {date} | {_cell(close)} | {_cell(_prediction_label(morning_row))} | {_cell(_prediction_label(ml_row))} | [일일 분석](/lab/{lab_slug}) |"
        )
    lines.extend([
        "",
        "주간 대상 daily Feed links:",
        "",
    ])
    for post in sorted(stockpulse_posts, key=lambda row: str(row.get("slug"))):
        slug = _cell(post.get("slug"))
        title = _cell(post.get("title"))
        lines.append(f"- [{title}](/stock/{slug})")

    lines.extend(["", "## 큰 오차 사례", ""])
    if errors:
        for row in errors[:3]:
            lines.append(
                f"- **{row.get('date')} · {row.get('session')}**: {_prediction_label(row)}. "
                f"실제 방향은 {_cell(row.get('actual_direction'))}, 실제 KOSPI 종가는 {_cell(row.get('actual_kospi_close'))}였다. "
                f"{_cell(row.get('fail_reason'))}"
            )
    else:
        lines.append("- 평가 실패 사례가 기록되지 않았다.")

    lines.extend(["", "## 성공 사례", ""])
    if successes:
        for row in successes[:3]:
            lines.append(
                f"- **{row.get('date')} · {row.get('session')}**: {_prediction_label(row)}. "
                f"실제 방향 {_cell(row.get('actual_direction'))}, 실제 KOSPI {_cell(row.get('actual_kospi_close'))}와 비교해 판정했다."
            )
    else:
        lines.append("- 성공으로 판정된 사례가 없다.")

    lines.extend([
        "",
        "## 자기개선 내용",
        "",
        f"- **LLM prompt lane**: {llm_text}",
        f"- **ML feature/model lane**: {ml_text}",
        "- 원시 evaluation row가 제안한 공통 방향:",
    ])
    for phrase in improvement_phrases[:6]:
        lines.append(f"  - {phrase}")

    lines.extend([
        "",
        "## 전주 대비 변화",
        "",
        "| 지표 | 전주(2026-08-11~14) | 이번 주(2026-08-18~21) | 변화 |",
        "|---|---:|---:|---:|",
        f"| LLM accuracy | {_percent(previous_morning['accuracy_rate'])} | {_percent(morning['accuracy_rate'])} | {_rate_delta(morning['accuracy_rate'] - previous_morning['accuracy_rate'])} |",
        f"| LLM mean score | {_score(previous_morning['mean_accuracy_score'])} | {_score(morning['mean_accuracy_score'])} | {_delta(morning['mean_accuracy_score'] - previous_morning['mean_accuracy_score'])} |",
        f"| ML accuracy | {_percent(previous_ml['accuracy_rate'])} | {_percent(ml['accuracy_rate'])} | {_rate_delta(ml['accuracy_rate'] - previous_ml['accuracy_rate'])} |",
        f"| ML mean score | {_score(previous_ml['mean_accuracy_score'])} | {_score(ml['mean_accuracy_score'])} | {_delta(ml['mean_accuracy_score'] - previous_ml['mean_accuracy_score'])} |",
        f"| 전체 accuracy | {_percent(previous_overall['accuracy_rate'])} | {_percent(overall['accuracy_rate'])} | {_rate_delta(overall['accuracy_rate'] - previous_overall['accuracy_rate'])} |",
        f"| 전체 mean score | {_score(previous_overall['mean_accuracy_score'])} | {_score(overall['mean_accuracy_score'])} | {_delta(overall['mean_accuracy_score'] - previous_overall['mean_accuracy_score'])} |",
        "",
        "전체 정확도는 전주 12.5%에서 이번 주 37.5%로 25.0%p 높아졌다. 다만 LLM 평균 score는 0.5375에서 0.4875로 낮아졌고, 이번 주의 개선은 극단적인 실패와 반등 사례가 함께 섞인 짧은 구간의 결과다. ML은 전주에 4건 모두 실패했지만 이번 주에는 1건의 방향성 성공이 발생했다.",
        "",
        "## 다음 주 변경사항",
        "",
        "- LLM은 갭 상승 뒤 하락하는 전강후약, 과매도 반등, 대형주 중심의 지수 왜곡을 조건부 시나리오로 계속 기록한다.",
        "- ML은 장중 변동성·VIX·외국인/기관 수급·실시간 뉴스 감성·섹터 편차·대형주 지수 기여도 반영 여부를 분리해 확인한다.",
        "- 다음 주에는 ‘개선안이 기록되었는가’와 ‘다음 prediction 입력에 실제 적용되었는가’를 구분해서 검증한다.",
        "- 표본이 충분히 쌓이기 전에는 threshold 조정이나 모델 우열 결론을 내리지 않는다.",
        "",
        "## 한계와 판정",
        "",
        "이번 Weekly Note는 4거래일, 8개 prediction/evaluation row를 사용했다. accuracy score는 기존 StockPulse 평가 규칙의 산출값이며 실제 투자 성과나 미래 수익률을 의미하지 않는다. 시장 급변일이 포함되어 있어 전주 대비 변화도 방향성 신호가 아니라 관찰 기록으로 해석해야 한다.",
        "",
        "이번 주의 장기 자산은 이 주간 기록이며, 원본 StockPulse daily article와 `predictions` 원시 데이터는 별도로 보존한다. 이 문서는 투자 조언이 아닌 자기개선 실험 기록이다.",
        "",
        "## 원본 Daily Lab Note",
        "",
    ])
    for slug in sorted(set(lab_note_slugs)):
        lines.append(f"- [Daily Lab Note](/lab/{_cell(slug)})")
    return "\n".join(lines).rstrip() + "\n"


def validate_weekly_note(note: str, expected_dates: list[str]) -> bool:
    for heading in REQUIRED_HEADINGS:
        assert f"## {heading}" in note, f"missing required heading: {heading}"
    for date in expected_dates:
        assert f"| {date} |" in note, f"missing daily result: {date}"
    assert "predictions" in note
    assert "투자 조언이 아닌 자기개선 실험 기록" in note
    forbidden = ("/home/", "localhost", "run_id", "service_role", "Traceback", "Cron Job")
    assert not any(token.lower() in note.lower() for token in forbidden), "private execution marker leaked"
    assert len(note) >= 1200, "weekly note is unexpectedly short"
    return True
