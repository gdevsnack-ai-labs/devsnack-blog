# DevSnack AdSense·검색 표면 감사 2차 마감 기록

- 기록일: 2026-09-21 23:06 KST
- 운영 주소: https://devsnack-blog.vercel.app
- 저장소: `/home/kahros/workspace/vercel-blog/devsnack-blog`
- 구현 commit: `006f10672a4ac469cc4122f856940c6ceab1cb43`
- 구현 commit message: `seo: align second-wave editorial surfaces`
- 기록 성격: 1차 정책을 재작업하지 않은 2차 범위의 구현·검증·배포 마감 기록

## 범위

이번 작업은 다음 남은 항목만 다뤘다.

- `/data`와 `/demos` 메인 허브
- populated demo category
- Lab Board와 상세·metadata·sitemap 정합성
- StockPulse V1 Fixed editorial/raw surface 분리
- Research 상태와 metadata 정책
- article/research/lab byline·provenance

다음 1차 완료 대상은 재작업하지 않았다.

- `/search/*`
- `/tools/operations/*`
- `/operations/*`
- `/data/hermes-usage/*`
- `/stock/*`

## Research metadata 불일치와 해결

### 원인

Research 후보에 대한 route policy 함수는 `noindex`를 반환했지만, 일부 slug는 `next.config.ts`의 영구 redirect를 통해 외부 Research Notebook으로 이동하고 있었다. 로컬 HTML read-back이 redirect를 따라가 외부 페이지의 `index, follow`를 읽었기 때문에, DevSnack의 실제 `/research/[slug]` metadata 경로와 다른 결과가 관찰됐다.

따라서 원인은 다음과 같이 정리한다.

- `/research/[slug]`의 `generateMetadata()`는 공통 search policy 경로를 사용하고 있었다.
- page/layout의 robots override가 원인이 아니었다.
- slug/status 데이터 매핑 자체보다 redirect destination이 read-back 대상을 바꾼 것이 핵심이었다.
- policy 함수만 검사한 focused test가 redirect를 따라간 외부 HTML까지 검증하지 못했다.

### 수정

- 실행 전·보류 성격의 Research 후보를 `RESEARCH_NOINDEX_SLUGS`로 명시했다.
- 해당 후보는 외부 Notebook redirect 대상에서 제외했다.
- 후보 slug를 route search policy와 AdSense policy가 함께 사용하도록 연결했다.
- Research metadata migration 테스트를 추가했다.
- 실제 실행·측정·결론이 있는 대표 Research는 index 상태를 유지했다.

### Production read-back

`noindex, follow`와 AdSense loader 부재를 직접 확인한 대표 후보:

- `/research/tokenchaser-self-bench-pack-gb10-llm`
- `/research/wan-dancer-14b-music-to-dance`
- `/research/higgs-tts-3-4b`

`index, follow`와 광고 유지가 확인된 대표 결과 글:

- `/research/qwen-image-21-local-first-impressions`
- `/research/yue2-3b-symbolic-music-generation-autumn-chanson`
- `/research/ornith-1-5-gguf-gb10`

## 최종 route 정책

- `/data`: `noindex, follow`, sitemap 제외, AdSense loader 제외
- `/demos`: `noindex, follow`, sitemap 제외, AdSense loader 제외
- `/demos/html`: `index, follow`, sitemap 포함, 광고 유지
- `/demos/music`: `index, follow`, sitemap 포함, 광고 유지
- `/demos/shortmovie`: `index, follow`, sitemap 포함, 광고 유지
- `/labs/stockpulse-v1-fixed`: `index, follow`, sitemap 포함, 광고 유지
- `/labs/stockpulse-v1-fixed/runs`: `noindex, follow`, sitemap 제외, AdSense loader 제외

## Lab·StockPulse·콘텐츠 신뢰 신호

- Lab Board의 공개 상세 프로젝트 10개와 sitemap 상세 항목을 일치시켰다.
- 실제 Finding·Evidence·Scope·실행 결과가 있는 Lab은 index를 유지했다.
- `publicDiscovery`, metadata robots, sitemap 판단을 같은 공개 기준으로 정렬했다.
- StockPulse editorial summary는 indexable 상태로 유지했다.
- 대량 raw Run Board/daily 기록은 `/labs/stockpulse-v1-fixed/runs`로 분리하고 noindex·광고 제외했다.
- `DevSnack Lab` pseudonym byline과 `/about` author URL을 article/research/lab 상세에 적용했다.
- provenance에서 직접 측정·AI-assisted·automated/data-generated 성격을 구분할 수 있도록 공통 표시를 적용했다.

## Sitemap·Production read-back

- Production sitemap URL 수: **88개**
- unique URL 수: **88개**
- 로컬 예상 88개와 일치
- noindex route의 sitemap 포함: **0개**
- Lab Board 공개 상세 누락: **0개**
- 대표 route canonical: 정상
- `/data`, `/demos`, raw Run Board: sitemap 제외 및 loader 제외
- populated demo와 StockPulse editorial: sitemap 포함 및 광고 유지

## 검증 결과

통과한 검사:

- `npm test`
- `npm run lint`
- `npm run build`
  - Next.js 16.2.10
  - static pages `40/40`
  - `ƒ Proxy (Middleware)` 생성
- `npm run audit:site`
  - sitemap 88개
  - route/content policy 20/20
  - retirement/migration 제외 통과
  - mobile overflow 0
- `SITE_URL=https://devsnack-blog.vercel.app npm run audit:links`
  - sitemap pages 88개
  - internal targets 152개
  - broken 0개
- `npm run audit:public-content`
- `npm run audit:security`
- `git diff --check`

참고로 환경변수 없이 실행한 별도 `npm run audit:links` 백그라운드 작업은 로컬 기본 대상에 접근하지 못해 `sitemap HTTP 0`으로 종료했다. Production 검증은 위의 `SITE_URL=https://devsnack-blog.vercel.app` 명시 실행으로 완료했고 broken link 0개를 확인했다.

## 배포·저장소 상태

- `origin/main` read-back commit: `006f10672a4ac469cc4122f856940c6ceab1cb43`
- Production 배포 반영 확인 완료
- Production HTML·robots meta·canonical·sitemap·AdSense loader read-back 완료
- 최종 working tree clean

## 다음 상태

이번 2차 감사 범위는 종료한다. 글 발행은 중단하지 않으며, 이후 신규 콘텐츠는 직접 실행·측정·해석이 있는 대표 결과는 index 후보로, 자동·raw·utility·실행 전 후보는 noindex 후보로 판단한다. 새 예외를 추가할 때는 metadata·sitemap·광고 정책과 Production read-back을 함께 남긴다.
