# DevSnack Blog — 시스템 아키텍처

> 최종 업데이트: 2026-07-20 (v3 리디자인)

---

## 🏗️ 전체 구조

```
사용자 ──→ https://devsnack-blog.vercel.app
                │
           ┌────┴────┐
           │  Vercel │ (Next.js 16, Hobby, $0)
           └────┬────┘
                │
           ┌────┴────┐
           │ Supabase│ (Postgres 17, 500MB, $0)
           └────┬────┘
                │
           ┌────┴────┐
           │  DGX    │ ← Hermes Agent, 로컬 LLM(Qwen3.5-35B), 크론잡
           │  Spark  │
           └─────────┘
```

## 📦 기술 스택

| 계층 | 기술 | 용도 |
|:-----|:-----|:------|
| **프론트엔드** | Next.js 16 (App Router) | SSR/ISR 페이지 렌더링 |
| **스타일링** | Tailwind CSS v4 + shadcn/ui | UI 컴포넌트 |
| **DB** | Supabase (Postgres 17) | 블로그 글, FTS |
| **배포** | Vercel (Hobby, $0) | Git push → 자동 배포 |
| **아이콘** | lucide-react | UI 아이콘 |
| **차트** | Recharts | 부동산/주식 차트 |

## 🧭 라우트 구조

| 경로 | 타입 | 설명 |
|:-----|:----:|:------|
| `/` | ISR 60s | 랜딩 페이지 (Lab Stats + 블로그 카드) |
| `/devsnack` | ISR 60s | DevSnack 블로그 목록 |
| `/devsnack/[slug]` | Dynamic | DevSnack 개별 글 |
| `/stock` | ISR 60s | StockPulse 주식 분석 |
| `/stock/[slug]` | Dynamic | StockPulse 개별 리포트 |
| `/realestate` | Static | 부동산 실거래 대시보드 |
| `/realestate/[slug]` | Dynamic | 부동산 개별 글 |
| `/aitech` | ISR 60s | AI Tech Insight 목록 |
| `/aitech/[slug]` | Dynamic | AI Tech 개별 글 |
| `/lab` | ISR 60s | Lab 대시보드 (실험 목록) |
| `/lab/[id]` | ISR 60s | Lab 개별 실험 상세 |
| `/search` | Static | 통합 검색 |
| `/about` | Static | 소개 |
| `/privacy` | Static | 개인정보처리방침 |
| `/contact` | Static | 문의 |
| `/links` | Static | YouTube/GitHub 링크 |
| `/rss.xml` | Dynamic | RSS 피드 |
| `/sitemap.xml` | Static | Sitemap |

## 🧩 컴포넌트 구조

```
src/
├── app/                    # Pages (App Router)
├── components/
│   ├── ui/                # shadcn/ui (badge, button, card, nav-menu, sheet)
│   ├── app-layout.tsx     # LNB + Content + MobileTabBar 래퍼
│   ├── side-nav.tsx       # PC 좌측 LNB (접힘 가능)
│   ├── mobile-tab-bar.tsx # 모바일 하단 탭
│   ├── blog-header.tsx    # 페이지별 상단 헤더 (간소화)
│   ├── blog-card.tsx      # 블로그 카드
│   ├── blog-sidebar.tsx   # 블로그 내 사이드바 (검색/태그/월별)
│   ├── lab-dashboard.tsx  # Lab 통계 카드
│   ├── lab-project-card.tsx # Lab 프로젝트 카드
│   ├── current-experiment-card.tsx # 현재 진행 중 실험 박스
│   ├── experiment-strip.tsx # 진행 중 실험 스트립
│   ├── latest-post-card.tsx  # 최신 글 카드
│   ├── latest-video-card.tsx # 최신 영상 카드
│   ├── progress-bar.tsx   # 진행률 바
│   ├── subscribe-cta.tsx  # 구독 CTA
│   ├── tag-chip.tsx       # 태그 칩
│   └── view-counter.tsx   # 조회수
├── data/
│   ├── experiments.ts     # Lab 실험 데이터 모델
│   └── current-experiment.ts  # 현재 진행 중 실험
└── lib/
    ├── supabase.ts        # Supabase 클라이언트
    └── colors.ts          # 블로그별 색상 테마
```

## 🔄 데이터 흐름

### 블로그 발행 (StockPulse 예시)

```
16:00 크론잡 (Hermes)
  → web_search + reasoning → 장 마감 분석 리포트
  → ~/.hermes/cron/output/0f06bf00b795/*.md

17:00 stockpulse_publish.py (no_agent)
  → 리포트 읽기
  → 로컬 Qwen3.5-35B (제목 생성)
  → matplotlib (차트 썸네일)
  → Blogger API (발행)
  → Supabase REST API (INSERT)
  → Vercel ISR 60초 내 반영
```

### Lab 데이터

```
정적: src/data/experiments.ts (수동 관리)
동적: Supabase posts 테이블 (블로그 글 수)
정적: public/data/youtube-latest.json (DGX Spark → 매일 sync)
```

## 🔐 보안

- Supabase 키: Vercel 환경변수 (`NEXT_PUBLIC_SUPABASE_*`)
- OAuth 토큰: GitHub Secret (Blogger API)
- `.env*.local` → `.gitignore` (`.env.example`만 공개)
