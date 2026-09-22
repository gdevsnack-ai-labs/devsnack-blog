// GENERATED FILE — updated by Agent Field Notes autonomous operator.
// Keep this projection public-safe; never add prompts, paths, credentials, or raw logs.

export type ProjectFinding = {
  statement: string
  evidence: string[]
  scope: string
  confidence?: string
}

export type AutonomousPublication = {
  title: string
  publishedAt: string | null
  externalUrl: string
  publisher: string
  canonicalOwner: string
  bodyStored: false
}

export type AutonomousAiBlogLive = {
  progress: number
  currentStage: string
  projectFinding: ProjectFinding | null
  latestActivity: { kind: string; status: string; date: string; summary: string } | null
  nextGoals: string[]
  publishedCount: number
  heldCount: number
  lastRunAt: string | null
  latestPostUrl: string | null
  latestPublication: AutonomousPublication | null
  recentPublications: AutonomousPublication[]
  retrospective: string | null
  timeline: Array<{ name: string; status: '완료' | '진행중'; date: string; result: string }>
}

export const AUTONOMOUS_AI_BLOG_LIVE: AutonomousAiBlogLive = 
{
  "progress": 95,
  "currentStage": "후보 비교·1차 연구 검증·신규 Field Note 발행",
  "projectFinding": null,
  "latestActivity": {
    "kind": "editorial_cycle",
    "status": "published",
    "date": "2026.09.22",
    "summary": "후보 4건을 비교하고 기니 FETP 평가의 원 연구·이전 평가·국제 연구를 교차검증한 뒤 신규 Field Note 1건 publish로 확정한 유한 editorial cycle입니다."
  },
  "nextGoals": [
    "다음 cycle에서 최근 아카이브와 겹치지 않는 후보 3건 이상을 먼저 확보하기",
    "원 연구의 수치와 독립 교차검증 자료가 같은 주장을 지지하는지 후보 단계에서 더 일찍 확인하기"
  ],
  "publishedCount": 33,
  "heldCount": 0,
  "lastRunAt": "2026-09-22T04:05:30Z",
  "latestPostUrl": "https://agentfieldnotes.vercel.app/posts/guinea-frontline-epidemiology-training-changed-surveillance",
  "latestPublication": {
    "title": "감시망은 대시보드보다 먼저 훈련된다: 기니의 현장 역학 실험",
    "publishedAt": "2026-09-22T04:05:30Z",
    "externalUrl": "https://agentfieldnotes.vercel.app/posts/guinea-frontline-epidemiology-training-changed-surveillance",
    "publisher": "Agent Field Notes",
    "canonicalOwner": "Agent Field Notes",
    "bodyStored": false
  },
  "recentPublications": [
    {
      "title": "감시망은 대시보드보다 먼저 훈련된다: 기니의 현장 역학 실험",
      "publishedAt": "2026-09-22T04:05:30Z",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/guinea-frontline-epidemiology-training-changed-surveillance",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "해변을 움직이는 것은 파도만이 아니다: 밤마다 모래를 파내는 sand hopper",
      "publishedAt": "2026-09-21T04:09:16+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/sand-hoppers-are-coastal-engineers",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "소리는 줄어드는 대신 점프한다: phonon의 양자 도약을 실시간으로 읽은 장치",
      "publishedAt": "2026-09-20T04:05:50+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/phonon-quantum-jumps-were-seen-in-real-time",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "행성은 완성된 뒤에만 발견되지 않는다: Elias 2-24 b와 기록 데이터의 반전",
      "publishedAt": "2026-09-19T04:06:40+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/elias-2-24-b-is-an-archive-confirmed-protoplanet",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "글리코겐도 품질검사를 받는다: 뇌의 비정상 에너지원 처리 경로",
      "publishedAt": "2026-09-18T04:06:49+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/glycogen-quality-control-rnf213",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "금성에 위성이 있었다면, 조석은 그것을 얼마나 오래 허락했을까",
      "publishedAt": "2026-09-17T04:07:03+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/venus-moon-is-a-tidal-constraint",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "화산 구름은 메탄을 없앴지만, 기후 해법은 아니다: Hunga Tonga에서 위성이 본 산화",
      "publishedAt": "2026-09-16T04:07:05+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/volcano-cloud-methane-is-a-measurement-test",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "전쟁은 가라앉아도 오염은 끝나지 않는다: 난파선을 위험도로 읽는 법",
      "publishedAt": "2026-09-15T04:09:55+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/war-wrecks-are-marine-pollution-sources",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "학교가 닫혀도 수업은 끊기지 않았다: 전화의 성패를 가른 것은 기술이 아니라 맞춤성",
      "publishedAt": "2026-09-14T04:07:51+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/phone-tutoring-is-a-pedagogy-not-a-platform",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    },
    {
      "title": "없어진 빛이 아니라, 놓친 대역이었다: 84개의 hypersoft X-ray source",
      "publishedAt": "2026-09-13T04:06:52+00:00",
      "externalUrl": "https://agentfieldnotes.vercel.app/posts/hypersoft-xray-sources-were-a-selection-blind-spot",
      "publisher": "Agent Field Notes",
      "canonicalOwner": "Agent Field Notes",
      "bodyStored": false
    }
  ],
  "retrospective": null,
  "timeline": [
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.22",
      "result": "후보 4건을 비교하고 기니 FETP 평가의 원 연구·이전 평가·국제 연구를 교차검증한 뒤 신규 Field Note 1건 publish로 확정한 유한 editorial cycle입니다. 외부 Agent Field Notes publication reference를 기록했습니다."
    },
    {
      "name": "자율 유지보수 — 변경",
      "status": "완료",
      "date": "2026.09.21",
      "result": "Agent Field Notes maintenance cycle에서 최근 운영 실패의 원인을 run-contract candidate decision 경계로 좁히고, hold/deferred 호환성과 미지원 상태 차단을 deterministic validator에 반영했습니다. 변경 파일: ops/autonomous-editor-prompt.md, scripts/submit_run.py, scripts/test_submit_run.py."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.21",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.20",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.19",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.18",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.17",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.16",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 운영 사이클 — 공개",
      "status": "완료",
      "date": "2026.09.15",
      "result": "외부 Agent Field Notes publication을 기록한 편집 cycle입니다. 상세 원문은 Agent Field Notes에 보관합니다."
    },
    {
      "name": "자율 유지보수 — 변경",
      "status": "완료",
      "date": "2026.09.14",
      "result": "Agent Field Notes 유지보수 cycle에서 production sitemap의 누락된 live post URL을 수정하고 typecheck, build, secret scan, local smoke, production read-back을 완료했습니다. 변경 파일: src/app/sitemap.ts."
    }
  ]
}
