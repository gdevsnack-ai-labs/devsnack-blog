#!/usr/bin/env python3
from stockpulse_weekly import build_weekly_note, calculate_metrics, validate_weekly_note

CURRENT = [
    {'date': '2026-08-18', 'session': 'morning', 'direction': '상승', 'kospi_target': '6950~7100', 'actual_kospi_close': 6870, 'actual_direction': '하락', 'accuracy_score': 0.45, 'is_correct': False, 'fail_reason': '전강후약을 놓쳤다.', 'improvement': '장중 변동성을 반영한다.'},
    {'date': '2026-08-18', 'session': 'ml', 'direction': '보합', 'kospi_target': '+0.0%', 'actual_kospi_close': 6870, 'actual_direction': '하락', 'accuracy_score': 0.0, 'is_correct': False, 'fail_reason': '변동성을 놓쳤다.', 'improvement': '갭과 고저차를 추가한다.'},
    {'date': '2026-08-19', 'session': 'morning', 'direction': '하락', 'kospi_target': '6750~6870', 'actual_kospi_close': 6471, 'actual_direction': '하락', 'accuracy_score': 0.65, 'is_correct': True, 'fail_reason': '하락 폭을 과소평가했다.', 'improvement': '극단 변동성을 반영한다.'},
    {'date': '2026-08-19', 'session': 'ml', 'direction': '하락', 'kospi_target': '-2.2%', 'actual_kospi_close': 6471, 'actual_direction': '하락', 'accuracy_score': 0.85, 'is_correct': True, 'fail_reason': '변동폭을 과소평가했다.', 'improvement': 'VIX와 수급 급변을 추가한다.'},
    {'date': '2026-08-20', 'session': 'morning', 'direction': '하락', 'kospi_target': '6400~6500', 'actual_kospi_close': 6853, 'actual_direction': '상승', 'accuracy_score': 0.0, 'is_correct': False, 'fail_reason': '반등을 놓쳤다.', 'improvement': '뉴스와 과매도 반등을 반영한다.'},
    {'date': '2026-08-20', 'session': 'ml', 'direction': '하락', 'kospi_target': '-1.9%', 'actual_kospi_close': 6853, 'actual_direction': '상승', 'accuracy_score': 0.0, 'is_correct': False, 'fail_reason': '반등을 놓쳤다.', 'improvement': '실시간 감성을 추가한다.'},
    {'date': '2026-08-21', 'session': 'morning', 'direction': '상승', 'kospi_target': '6900~7000', 'actual_kospi_close': 6913, 'actual_direction': '상승', 'accuracy_score': 0.85, 'is_correct': True, 'fail_reason': '상승 방향은 맞았다.', 'improvement': '상승의 질을 함께 본다.'},
    {'date': '2026-08-21', 'session': 'ml', 'direction': '하락', 'kospi_target': '-2.3%', 'actual_kospi_close': 6913, 'actual_direction': '상승', 'accuracy_score': 0.0, 'is_correct': False, 'fail_reason': '대형주 방어를 놓쳤다.', 'improvement': '섹터 편차와 weighted impact를 추가한다.'},
]

PREVIOUS = [
    {'date': '2026-08-11', 'session': 'morning', 'accuracy_score': 0.3, 'is_correct': False},
    {'date': '2026-08-11', 'session': 'ml', 'accuracy_score': 0.0, 'is_correct': False},
    {'date': '2026-08-12', 'session': 'morning', 'accuracy_score': 0.35, 'is_correct': False},
    {'date': '2026-08-12', 'session': 'ml', 'accuracy_score': 0.0, 'is_correct': False},
    {'date': '2026-08-13', 'session': 'morning', 'accuracy_score': 0.85, 'is_correct': True},
    {'date': '2026-08-13', 'session': 'ml', 'accuracy_score': 0.0, 'is_correct': False},
    {'date': '2026-08-14', 'session': 'morning', 'accuracy_score': 0.65, 'is_correct': False},
    {'date': '2026-08-14', 'session': 'ml', 'accuracy_score': 0.0, 'is_correct': False},
]

current = calculate_metrics(CURRENT)
previous = calculate_metrics(PREVIOUS)
assert current['overall']['count'] == 8
assert current['overall']['correct_count'] == 3
assert current['overall']['accuracy_rate'] == 0.375
assert current['overall']['mean_accuracy_score'] == 0.35
assert current['by_session']['morning']['correct_count'] == 2
assert current['by_session']['ml']['correct_count'] == 1
assert previous['overall']['correct_count'] == 1

note = build_weekly_note(
    week_start='2026-08-18',
    week_end='2026-08-21',
    predictions=CURRENT,
    previous_predictions=PREVIOUS,
    stockpulse_posts=[
        {'slug': '2026-08-18-morning', 'title': 'morning'},
        {'slug': '2026-08-18-evening', 'title': 'evening'},
    ],
    lab_note_slugs=[f'stockpulse-self-2026-08-{day}' for day in ['18', '19', '20', '21']],
    applied_actions={'2026-08-18': 'LLM prompt + ML features'},
)
assert validate_weekly_note(note, expected_dates=['2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'])
for heading in ['실험 질문과 범위', '주간 지표', '일별 compact result', '큰 오차 사례', '성공 사례', '자기개선 내용', '전주 대비 변화', '다음 주 변경사항', '한계와 판정']:
    assert f'## {heading}' in note
assert '0.4875' in note
assert '0.2125' in note
assert '37.5%' in note
assert 'stockpulse-self-2026-08-18' in note
assert note == build_weekly_note(
    week_start='2026-08-18', week_end='2026-08-21', predictions=CURRENT,
    previous_predictions=PREVIOUS,
    stockpulse_posts=[{'slug': '2026-08-18-morning', 'title': 'morning'}, {'slug': '2026-08-18-evening', 'title': 'evening'}],
    lab_note_slugs=[f'stockpulse-self-2026-08-{day}' for day in ['18', '19', '20', '21']],
    applied_actions={'2026-08-18': 'LLM prompt + ML features'},
)

try:
    validate_weekly_note(note.replace('## 주간 지표', '## 지표'), expected_dates=['2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'])
except AssertionError:
    pass
else:
    raise AssertionError('validation must reject a missing required heading')

print('StockPulse weekly aggregation tests passed')
