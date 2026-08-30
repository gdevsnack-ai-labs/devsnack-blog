# Research Note Promotion Policy

Research Note는 DevSnack 본체의 완성된 Knowledge 글이 아니라, 외부 자료를 기반으로 한 조사 단계 기록이다. Note는 조사 배경, 확인한 내용, 확인하지 못한 내용, 직접 실행·측정 여부, 다음 검증 계획을 보존한다.

## Promotion gate

Research Note에서 별도 DevSnack Lab·Benchmark·Knowledge asset으로 승격하는 것은 다음 신호가 충분할 때만 검토한다.

- 직접 실행의 성공 또는 실패 결과
- 직접 측정한 수치와 조건
- 실제 DevSnack 환경 적용 결과
- 동일 조건 비교 실험
- 다른 사람이 재현할 수 있는 방법
- 반복 검증으로 일회성 결과를 넘어선 근거
- DevSnack 환경에서만 얻은 판단
- 독립 페이지로 다시 참고할 가치가 있는 결론

단 한 번의 테스트가 있었다는 이유만으로 자동 승격하지 않는다. 실행 결과의 독립성·재현성·실용성·문서 가치가 별도로 확인되어야 한다.

## Relationship

```text
Research Note
  ├── external_url: GitHub Pages 공개 Note
  ├── original_devsnack_url: 이전 DevSnack Research 원문
  └── promoted_asset_url: null

검증된 독립 자산이 생긴 뒤
  └── promoted_asset_url: DevSnack Lab / Benchmark / Knowledge URL
```

승격 후에도 Research Note와 원문 URL은 삭제하지 않는다. 새 DevSnack asset에는 Research Note를 조사 원천으로 연결해 provenance chain을 보존한다.

## Search and publishing boundary

- GitHub Pages Research Note는 공개 Notebook으로 유지한다.
- DevSnack Research Board는 정적 snapshot으로 Note를 링크한다.
- 개별 migrated Research detail은 DevSnack 본체에서 중복 index하지 않는다.
- 승격 전 `promoted_asset_url`은 `null`이다.
- 승격 후에도 기존 Note를 Knowledge 글처럼 다시 포장하지 않는다.

## Current migration

이번 migration의 snapshot 대상은 public R1 10개, public R2 11개, M 통합 3개다. draft 5개와 X `Unsloth → GGUF 변환 파이프라인`은 제외했다. K1/K2는 DevSnack 내부 자산으로 유지한다.
