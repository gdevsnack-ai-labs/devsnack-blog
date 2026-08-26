"""AI Tech weekly event digest builder.

The historical backfill intentionally uses only evidence that was persisted at
publish time. It never treats a generated article as a substitute for source
text and never invents claim-support metrics that were not stored.
"""

from __future__ import annotations

import html
import re
from collections import defaultdict
from typing import Any, Iterable
from urllib.parse import urlparse

SOURCE_TIERS = {"FULL_REPORT", "NEWS_BRIEF", "REJECT"}
REQUIRED_HEADINGS = (
    "핵심 변화",
    "사건별 source-summary record",
    "의미와 해석",
    "다음 주 watch items",
    "Sources",
)

_STOPWORDS = {
    "ai", "ai기술", "기술", "뉴스", "관련", "공개", "발표", "추진", "예정", "전망",
    "새", "새로운", "대해", "대한", "위한", "통해", "이번", "내년", "올해", "정책",
    "한국", "산업", "기업", "중국", "미국", "글로벌", "시대", "전략", "대응", "로봇", "인재",
    "the", "and", "for", "with", "from", "new", "news", "ai", "tech",
}
_THEME_KEYWORDS = {
    "안전·규제": {"보안", "안전", "규제", "법", "소송", "공정", "조달", "standard", "security", "law", "regulation", "safety"},
    "인프라·하드웨어": {"데이터센터", "데이터", "반도체", "칩", "gpu", "tpu", "하드웨어", "전력", "ocp", "인프라", "hardware", "chip", "compute"},
    "시장·플랫폼": {"인수", "투자", "ipo", "플랫폼", "openrouter", "stripe", "mistral", "시장", "조달", "acquisition", "platform", "market"},
    "교육·인재": {"교육", "학생", "대학", "학교", "인재", "교사", "gist", "kt", "education", "student", "university"},
    "에이전트·제품": {"에이전트", "agent", "로봇", "robot", "제품", "서비스", "출시", "기업", "enterprise", "product"},
}
_THEME_INTERPRETATIONS = {
    "안전·규제": "이번 묶음에서 확인되는 공통 방향은 모델 성능보다 배포 과정의 보안·책임·조달 기준이 함께 움직인다는 점이다. 이는 source facts를 넘어선 편집자의 해석이다.",
    "인프라·하드웨어": "AI 확장은 모델만의 문제가 아니라 칩·전력·데이터센터·지역 규제의 결합 문제로 이동하고 있다는 해석이 가능하다. 이는 source facts를 넘어선 편집자의 해석이다.",
    "시장·플랫폼": "AI 생태계의 경쟁축이 모델 개발뿐 아니라 접근 경로·조달·자본·플랫폼 통제권으로 넓어지고 있다는 해석이다. 이는 source facts를 넘어선 편집자의 해석이다.",
    "교육·인재": "도입의 다음 병목이 모델 확보가 아니라 현장 인력과 교육 과정의 적응일 수 있다는 해석이다. 이는 source facts를 넘어선 편집자의 해석이다.",
    "에이전트·제품": "연구 데모를 넘어 실제 제품·서비스·조직 운영으로 넘어가는 과정에서 검증과 책임 범위가 중요해지고 있다는 해석이다. 이는 source facts를 넘어선 편집자의 해석이다.",
    "기타": "서로 다른 분야의 개별 움직임이어서 하나의 인과관계로 묶지 않고, 각 source가 명시한 범위 안에서만 읽어야 한다. 이는 source facts를 넘어선 편집자의 해석이다.",
}


def _tokens(text: str) -> set[str]:
    values = re.findall(r"[a-z][a-z0-9+.-]{1,}|[가-힣]{2,}", (text or "").lower())
    return {value for value in values if value not in _STOPWORDS}


def _strong_tokens(article: dict[str, Any]) -> set[str]:
    # Summary prose contains generic words shared by unrelated stories. Keep
    # event identity conservative: title tokens only, with generic terms removed.
    return _tokens(str(article.get("title") or ""))


def _similarity(left: dict[str, Any], right: dict[str, Any]) -> float:
    a = _strong_tokens(left)
    b = _strong_tokens(right)
    if not a or not b:
        return 0.0
    common = a & b
    if len(common) >= 2:
        return 1.0
    return len(common) / len(a | b)


def _theme(article: dict[str, Any]) -> str:
    tokens = _strong_tokens(article)
    scores = {
        name: len(tokens & keywords)
        for name, keywords in _THEME_KEYWORDS.items()
    }
    best_name, best_score = max(scores.items(), key=lambda item: item[1])
    return best_name if best_score else "기타"


def classify_reconstructed_source(source_url: str, summary: str) -> str:
    """Classify legacy evidence without claiming that an old crawl succeeded."""
    parsed = urlparse((source_url or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return "REJECT"
    if len(re.sub(r"\s+", "", summary or "")) < 120:
        return "REJECT"
    return "NEWS_BRIEF"


def cluster_events(articles: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """Cluster likely duplicate events while preserving distinct stories."""
    ordered = sorted(articles, key=lambda row: (str(row.get("published", "")), int(row.get("id", 0) or 0)))
    clusters: list[dict[str, Any]] = []
    for article in ordered:
        candidates = [
            (index, _similarity(article, cluster["articles"][0]))
            for index, cluster in enumerate(clusters)
        ]
        matching = [(index, score) for index, score in candidates if score >= 0.34]
        if matching:
            index = max(matching, key=lambda item: item[1])[0]
            clusters[index]["articles"].append(article)
            clusters[index]["theme"] = _theme(clusters[index]["articles"][0])
        else:
            clusters.append({
                "event_id": f"event-{len(clusters) + 1:02d}",
                "title": str(article.get("title") or "제목 미기록"),
                "theme": _theme(article),
                "articles": [article],
            })
    return clusters


_SIGNIFICANCE_KEYWORDS = {
    "소송", "규제", "조례", "조달", "인수", "ipo", "상장", "정책", "보안", "security",
    "저작권", "침해", "하드웨어", "칩", "데이터센터", "data center", "센터", "법", "유출", "해킹",
}
_RELEVANCE_KEYWORDS = {
    "ai", "인공지능", "에이전트", "agent", "모델", "llm", "보안", "안전", "규제", "데이터센터",
    "반도체", "칩", "tpu", "gpu", "인수", "플랫폼", "교육", "로봇", "ipo", "조달", "저작권", "학습",
    "음악",
}


def neutral_event_title(article: dict[str, Any]) -> str:
    """Create a neutral event label instead of inheriting an editorial headline."""
    title = str(article.get("title") or "제목 미기록")
    lower = title.lower()
    rules = [
        (("stripe", "openrouter"), "Stripe–OpenRouter 인수설 보도 (미확인)"),
        (("mistral", "조달"), "프랑스 공공 조달에서 Mistral 우선 방침 보도"),
        (("라운드힐", "소송"), "라운드힐 뮤직, Anthropic·Suno 상대 소송 제기"),
        (("포트나이트", "인수"), "Fortinet, Virtue AI 인수"),
        (("openai", "허깅페이스"), "OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도"),
        (("openai", "hugging face"), "OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도"),
        (("openai", "해킹"), "OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도"),
        (("openai", "학습", "중단"), "OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도"),
        (("openai", "보안"), "OpenAI, AI 보안 기준 공개"),
        (("존스 홉킨스", "에이전틱"), "Johns Hopkins·Great Learning, Agentic AI 인증 과정 출시"),
        (("자문위원회",), "미 보건교육 기관, 자문위원회 기반 산학 협력 강조"),
        (("patton", "데이터센터"), "Patton Township, 데이터센터 조닝 조례 개정"),
        (("앤트로픽", "tpu"), "Anthropic, Google TPU 인력 영입 보도"),
        (("치어오토모빌", "ipo"), "Chery 로봇 자회사 Aimoga 해외 IPO 추진 보도"),
        (("kt", "교육"), "KT·서울시, 초등학생 대상 AI 교육 프로그램 시작"),
        (("규제 데이터", "nlp"), "FinRegE, 규제 문서 4단계 NLP 선별 시스템 공개"),
        (("gist", "ax"), "GIST, 대학생 AI·로봇 인재 발굴 AX 챌린지 개최"),
        (("ocp", "파두"), "파두, OCP Korea Tech Day에서 AI 데이터센터 전략 공개"),
    ]
    for needles, neutral in rules:
        if all(needle in lower for needle in needles):
            return neutral
    # Conservative fallback: keep the source headline only when no rule can
    # safely remove its interpretation; mark it as a report rather than fact.
    compact = re.sub(r"\s+", " ", title).strip()
    return compact[:100]


def _score_event(cluster: dict[str, Any]) -> dict[str, int]:
    articles = cluster.get("articles", [])
    text = " ".join(str(item.get("title") or "") for item in articles).lower()
    tiers = {str(item.get("source_quality") or "REJECT") for item in articles}
    evidence = max({"REJECT": 0, "NEWS_BRIEF": 1, "FULL_REPORT": 3}.get(tier, 0) for tier in tiers) if tiers else 0
    relevance = min(3, sum(1 for token in _RELEVANCE_KEYWORDS if token in text))
    significance = min(3, sum(1 for token in _SIGNIFICANCE_KEYWORDS if token in text))
    return {
        "evidence": evidence,
        "relevance": relevance,
        "significance": significance,
        "total": evidence * 3 + relevance * 2 + significance * 2,
    }


def select_core_events(
    articles: list[dict[str, Any]],
    clusters: list[dict[str, Any]],
    core_limit: int = 5,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Select 4–6 core events and return the rest as compact roundup."""
    if not clusters:
        return [], []
    limit = min(max(1, core_limit), len(clusters))
    ranked: list[dict[str, Any]] = []
    for cluster in clusters:
        scored = dict(cluster)
        scored["selection_score"] = _score_event(cluster)
        ranked.append(scored)
    ranked.sort(key=lambda item: (
        -item["selection_score"]["total"],
        -item["selection_score"]["significance"],
        -item["selection_score"]["relevance"],
        str(item["articles"][0].get("published") or ""),
    ))
    core = ranked[:limit]
    core_ids = {item["event_id"] for item in core}
    roundup = [item for item in clusters if item["event_id"] not in core_ids]
    return core, roundup


def _source_summary_fact(value: str, limit: int = 520) -> str:
    text = _clean_summary(value, limit=limit)
    match = re.search(r"\[핵심 메시지\]\s*(.*?)(?=\s*\[(?:배경|특이사항|결과)|$)", text)
    if match:
        text = match.group(1).strip()
    else:
        sentences = re.split(r"(?<=[.!?。])\s+", text)
        text = " ".join(sentences[:2]).strip()
    return text[:limit]


def _clean_summary(value: str, limit: int = 460) -> str:
    text = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    text = re.sub(r"\s+", " ", text).replace("|", "／").strip()
    return text[:limit]


def _source_quality_counts(articles: Iterable[dict[str, Any]]) -> dict[str, int]:
    counts = {tier: 0 for tier in sorted(SOURCE_TIERS)}
    for article in articles:
        tier = str(article.get("source_quality") or "REJECT")
        if tier not in counts:
            tier = "REJECT"
        counts[tier] += 1
    return counts


def build_weekly_digest(
    week_start: str,
    week_end: str,
    articles: list[dict[str, Any]],
    clusters: list[dict[str, Any]] | None = None,
    core_limit: int = 5,
) -> str:
    clusters = clusters if clusters is not None else cluster_events(articles)
    core, roundup = select_core_events(articles, clusters, core_limit=core_limit)
    source_refs = {
        (int(article.get("id", 0) or 0), str(article.get("source_url") or "")): f"S{index:02d}"
        for index, article in enumerate(articles, start=1)
    }
    quality_counts = _source_quality_counts(articles)
    merged = sum(max(0, len(cluster["articles"]) - 1) for cluster in clusters)
    themes: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for cluster in core:
        themes[cluster["theme"]].append(cluster)

    lines = [
        f"# AI Tech Weekly Digest — {week_start}~{week_end}",
        "",
        "## 편집 범위와 evidence 경계",
        "",
        f"이번 Digest는 {week_start}부터 {week_end}까지 발행된 AI Tech daily article {len(articles)}개를 다시 편집한 기록이다. event/topic cluster는 {len(clusters)}개이며, 중복 사건 {merged}건 병합 후 핵심 사건 {len(core)}개와 roundup {len(roundup)}개로 압축했다.",
        "",
        "핵심 사건은 source evidence quality, AI Tech relevance, 사건의 significance를 점수화해 선정했다. 핵심 사건에는 source-summary evidence와 DevSnack/AI interpretation을 사건 단위로 분리해 싣고, roundup은 source-summary 한 줄과 source reference만 남겼다.",
        "",
        f"이 기간에 발행 시점에 보존된 source evidence는 RSS summary와 source URL이었다. historical summary에는 facts와 publisher-side interpretation이 섞여 있을 수 있고 crawl 전문과 article별 원래 fact-check 결과가 저장되지 않았으므로, 아래 core facts는 source-summary evidence 수준으로만 표시한다. 이번 backfill은 FULL_REPORT나 claim support rate를 소급하지 않고 NEWS_BRIEF 범위로만 편집했다.",
        "",
        f"Evidence decision: FULL_REPORT {quality_counts['FULL_REPORT']}개 · NEWS_BRIEF {quality_counts['NEWS_BRIEF']}개 · REJECT {quality_counts['REJECT']}개",
        "",
        "## 핵심 변화",
        "",
    ]
    for theme_name in sorted(themes):
        cluster_titles = " · ".join(neutral_event_title(cluster["articles"][0]) for cluster in themes[theme_name])
        lines.append(f"- **{theme_name}**: {len(themes[theme_name])}개 core event — {cluster_titles}")

    lines.extend(["", "## 핵심 사건", "", "## 사건별 source-summary record", ""])
    for index, cluster in enumerate(core, start=1):
        article = cluster["articles"][0]
        score = cluster.get("selection_score", _score_event(cluster))
        lines.extend([
            f"### {index}. {neutral_event_title(article)}",
            "",
            f"- 선정 점수: evidence {score['evidence']} · relevance {score['relevance']} · significance {score['significance']} · total {score['total']}",
            f"- source quality: `{article.get('source_quality', 'REJECT')}`",
            f"- source-summary evidence (historical facts/interpretation may be mixed): {_source_summary_fact(article.get('summary', '')) or '보존된 summary 없음'}",
            f"- DevSnack/AI interpretation: {_THEME_INTERPRETATIONS.get(cluster['theme'], _THEME_INTERPRETATIONS['기타'])}",
        ])
        if len(cluster["articles"]) > 1:
            lines.append(f"- 병합된 중복/후속 article: {len(cluster['articles']) - 1}개")
        for item in cluster["articles"]:
            source_url = str(item.get("source_url") or "")
            if source_url:
                source_ref = source_refs.get((int(item.get("id", 0) or 0), source_url), "S??")
                lines.append(f"- source_ref: {source_ref}")
        lines.append("")

    lines.extend(["## Compact roundup", "", f"핵심 사건으로 선정하지 않은 {len(roundup)}개 article은 중복·세부 사건·상대적 significance가 낮은 항목으로 compact 처리했다. 이 목록은 source-summary 수준의 단서만 제공하며, 독립적인 claim verification 결과가 아니다.", ""])
    for cluster in sorted(roundup, key=lambda item: str(item["articles"][0].get("published") or "")):
        article = cluster["articles"][0]
        source_url = str(article.get("source_url") or "")
        label = neutral_event_title(article)
        fact = _source_summary_fact(article.get("summary", ""), limit=220) or "source summary 없음"
        source_ref = source_refs.get((int(article.get("id", 0) or 0), source_url), "S??") if source_url else "—"
        link = f" — source_ref: {source_ref}"
        lines.append(f"- **{label}** — {fact}{link}")

    lines.extend(["", "## 의미와 해석", ""])
    if core:
        for theme_name in sorted(themes):
            lines.append(f"- **{theme_name}**: {_THEME_INTERPRETATIONS.get(theme_name, _THEME_INTERPRETATIONS['기타'])}")
    else:
        lines.append("- 핵심 사건으로 선정할 수 있는 evidence가 없다.")

    lines.extend([
        "",
        "## 다음 주 watch items",
        "",
        "- 같은 사건의 후속 발표가 기존 event cluster에 추가되는지 확인한다.",
        "- RSS summary만 남은 source가 원문 crawl evidence까지 확보되는지 관찰한다.",
        "- 새 pipeline의 claim classification에서 SUPPORTED와 INFERENCE가 실제로 분리되는지 확인한다.",
        "- source evidence가 부족한 항목을 장문 Report로 승격하지 않고 NEWS_BRIEF 또는 REJECT로 유지한다.",
        "",
        "## Sources",
        "",
    ])
    for article in articles:
        source_url = str(article.get("source_url") or "")
        if source_url:
            source_ref = source_refs.get((int(article.get("id", 0) or 0), source_url), "S??")
            lines.append(f"- **{source_ref}** [{neutral_event_title(article)}]({source_url})")
    return "\n".join(lines).rstrip() + "\n"


def validate_weekly_digest(
    content: str,
    expected_article_count: int,
    expected_cluster_count: int,
    expected_core_count: int | None = None,
    expected_roundup_count: int | None = None,
) -> list[str]:
    issues: list[str] = []
    for heading in REQUIRED_HEADINGS:
        if f"## {heading}" not in content:
            issues.append(f"missing heading: {heading}")
    if f"article {expected_article_count}개" not in content:
        issues.append("article count mismatch")
    if f"cluster는 {expected_cluster_count}개" not in content:
        issues.append("cluster count mismatch")
    if expected_core_count is not None and f"핵심 사건 {expected_core_count}개" not in content:
        issues.append("core count mismatch")
    if expected_roundup_count is not None and f"roundup {expected_roundup_count}개" not in content:
        issues.append("roundup count mismatch")
    if content.count("## Sources") != 1:
        issues.append("sources section count mismatch")
    if "Traceback" in content or "RuntimeError" in content or "/home/" in content:
        issues.append("execution artifact leaked")
    return issues
