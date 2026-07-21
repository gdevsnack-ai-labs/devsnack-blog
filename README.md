# DevSnack Blog

> NVIDIA DGX Spark GB10 기반 AI 연구실 블로그
> **Next.js 16 + Supabase + Vercel** — AI와 함께 만드는 블로그

---

## 🤖 AI와 함께하는 블로그 관리

이 블로그의 모든 과정 — 디자인, 코딩, 배포, 장애 대응 — 은
**Hermes Agent (AI)**와 **사장님 (사람)**이 함께합니다.

- **AI가 초안을 작성하고 코드를 구현합니다**
- **사장님이 검증하고 방향을 결정합니다**
- **실패와 디버깅 과정도 모두 기록으로 남깁니다**

운영 로그는 [Hermes Wiki](https://github.com/kahros82/hermes_wiki)에서 확인할 수 있습니다.

---

## 🧪 구성

### 블로그 4개 (Supabase 단일 DB, `blog_id`로 분리)

| 블로그 | URL | blog_id | 성격 |
|:-------|:----|:--------|:-----|
| **DevSnack** | `/devsnack` | `devsnack` | AI 인프라 실험, LLM 벤치마크, 기술 칼럼 |
| **StockPulse** | `/stock` | `stockpulse` | AI 기반 KOSPI/KOSDAQ 일일 분석 |
| **부동산** | `/realestate` | `realestate` | 아파트 실거래가 동향 |
| **AI Tech Insight** | `/aitech` | `aitech` | AI 기술/산업 뉴스 분석 |

### Lab (진행 중인 실험)

DevSnack의 핵심은 **Lab** — AI와 함께 진행 중인 실험들을 추적합니다.
각 실험은 블로그 시리즈, YouTube 영상, GitHub 저장소와 연결됩니다.

[👉 Lab 바로가기](/lab)

---

## 🏗️ 기술 스택

| 계층 | 기술 | 버전 |
|:-----|:-----|:----:|
| **프레임워크** | Next.js (App Router) | 16.2 |
| **스타일링** | Tailwind CSS + shadcn/ui | v4 |
| **DB** | Supabase (Postgres) | 17 |
| **배포** | Vercel (Hobby, \$0) | — |
| **아이콘** | lucide-react | 1.25 |
| **차트** | Recharts | 3.9 |

### 백엔드 (DGX Spark GB10)

| 서비스 | 역할 |
|:-------|:-----|
| **Hermes Agent** | AI 비서 (크론잡, 분석, 블로그 발행 자동화) |
| **llama.cpp + Qwen3.5-35B** | 로컬 LLM (제목 생성, 리포트 요약) |
| **ComfyUI + Krea 2** | 이미지 생성 (블로그 썸네일) |
| **FinanceDataReader** | 주식/환율 데이터 수집 |

---

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 랜딩 페이지
│   ├── devsnack/          # DevSnack 블로그
│   ├── stock/             # StockPulse
│   ├── realestate/        # 부동산
│   ├── aitech/            # AI Tech Insight
│   ├── lab/               # ⭐ Lab (진행 중인 실험)
│   ├── search/            # 통합 검색
│   └── about/             # 소개
├── components/             # UI 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── side-nav.tsx       # ⭐ 좌측 네비게이션 (LNB)
│   ├── mobile-tab-bar.tsx # ⭐ 모바일 하단 탭
│   └── blog-header.tsx    # 상단 네비게이션
├── data/                   # 정적 데이터
│   ├── experiments.ts     # Lab 실험 목록
│   └── current-experiment.ts # 현재 진행 중 실험
└── lib/                    # 유틸리티
    ├── supabase.ts        # Supabase 클라이언트
    └── colors.ts          # 블로그별 색상 테마
docs/
├── PLAN-2026-07-20.md     # 리디자인 계획
├── ARCHITECTURE.md        # 시스템 아키텍처
└── AI-COLLAB.md           # AI 협업 워크플로우 기록
```

---

## 🚀 로컬 개발

```bash
# 1. 저장소 클론
git clone https://github.com/gdevsnack-ai-labs/devsnack-blog.git
cd devsnack-blog

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local에 Supabase 키 입력

# 4. 개발 서버 실행
npm run dev
```

---

## 📜 라이선스

MIT — 자유롭게 사용하고 연구하세요.
다만 이 블로그의 콘텐츠(글, 이미지)는 별도 라이선스가 적용될 수 있습니다.

---

*이 프로젝트는 AI(Hermes Agent)와 사람(문규 강)의 협업으로 운영됩니다.*
