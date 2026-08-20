'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  GitBranch,
  ListChecks,
  Network,
  RefreshCw,
  Search,
  Server,
  Terminal,
  Wrench,
  XCircle,
} from 'lucide-react'
import type {
  CronJob,
  DockerContainer,
  HealthCheck,
  InstalledTool,
  OperationPort,
  OperationsHealth,
  OperationsSnapshot,
  SystemdService,
} from '@/lib/operations-types'

interface OperationsDashboardProps {
  snapshot: OperationsSnapshot
  available: boolean
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function healthLabel(health: OperationsHealth | string): string {
  if (health === 'ok' || health === 'active') return '정상'
  if (health === 'warning' || health === 'paused') return '주의'
  if (health === 'error' || health === 'failed') return '오류'
  return '확인 필요'
}

function healthClass(health: OperationsHealth | string): string {
  if (health === 'ok' || health === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
  }
  if (health === 'warning' || health === 'paused') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
  }
  if (health === 'error' || health === 'failed') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
  }
  return 'border-border bg-muted text-muted-foreground'
}

function HealthBadge({ health, label }: { health: OperationsHealth | string; label?: string }) {
  const isGood = health === 'ok' || health === 'active'
  const isError = health === 'error' || health === 'failed'
  const Icon = isGood ? CheckCircle2 : isError ? XCircle : AlertTriangle
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${healthClass(health)}`}>
      <Icon className="h-3 w-3" />
      {label || healthLabel(health)}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, detail, tone }: {
  icon: typeof Activity
  label: string
  value: number | string
  detail: string
  tone: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  )
}

function SectionHeading({ id, icon: Icon, title, count, description }: {
  id: string
  icon: typeof Activity
  title: string
  count?: number
  description: string
}) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-bold">{title}</h2>
        {count !== undefined && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PortTable({ ports }: { ports: OperationPort[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">포트</th>
            <th className="px-4 py-3 font-medium">서비스</th>
            <th className="px-4 py-3 font-medium">프로세스</th>
            <th className="px-4 py-3 font-medium">바인딩</th>
            <th className="px-4 py-3 font-medium">분류</th>
            <th className="px-4 py-3 font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ports.map((port) => (
            <tr key={`${port.protocol}-${port.bind}-${port.port}-${port.process}`} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-mono font-semibold">{port.port}<span className="ml-1 text-xs font-normal text-muted-foreground">/{port.protocol}</span></td>
              <td className="px-4 py-3 font-medium">{port.service}</td>
              <td className="max-w-[190px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">{port.process || '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{port.bind}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{port.category}</td>
              <td className="px-4 py-3"><HealthBadge health={port.health} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {ports.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>}
    </div>
  )
}

function DockerTable({ containers }: { containers: DockerContainer[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {containers.map((container) => (
        <div key={container.name} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{container.name}</p>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{container.image}</p>
            </div>
            <HealthBadge health={container.health} />
          </div>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3"><span>상태</span><span className="text-right text-foreground">{container.status || '—'}</span></div>
            <div className="flex justify-between gap-3"><span>포트</span><span className="max-w-[70%] text-right font-mono text-[11px] text-foreground">{container.ports || '내부 포트만 사용'}</span></div>
          </div>
        </div>
      ))}
      {containers.length === 0 && <p className="text-sm text-muted-foreground">Docker 컨테이너 데이터가 없습니다.</p>}
    </div>
  )
}

function SystemdTable({ services }: { services: SystemdService[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">서비스</th>
            <th className="px-4 py-3 font-medium">상태</th>
            <th className="px-4 py-3 font-medium">Load</th>
            <th className="px-4 py-3 font-medium">설명</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {services.map((service) => (
            <tr key={service.name} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs font-medium">{service.name}</td>
              <td className="px-4 py-3"><HealthBadge health={service.health} label={`${service.active} / ${service.sub}`} /></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{service.load}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{service.description || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {services.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>}
    </div>
  )
}

function CronTable({ jobs }: { jobs: CronJob[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">작업</th>
            <th className="px-4 py-3 font-medium">스케줄</th>
            <th className="px-4 py-3 font-medium">방식</th>
            <th className="px-4 py-3 font-medium">모델</th>
            <th className="px-4 py-3 font-medium">최근 실행</th>
            <th className="px-4 py-3 font-medium">다음 실행</th>
            <th className="px-4 py-3 font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-muted/30">
              <td className="max-w-[220px] px-4 py-3">
                <p className="truncate font-medium">{job.name || job.id}</p>
                <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{job.script || job.id}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{job.schedule || '—'}</td>
              <td className="px-4 py-3"><span className="rounded bg-muted px-2 py-1 text-xs">{job.noAgent ? 'script' : 'agent'}</span></td>
              <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted-foreground">{job.model || '—'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(job.lastRunAt)}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(job.nextRunAt)}</td>
              <td className="px-4 py-3"><HealthBadge health={job.enabled ? (job.lastStatus === 'ok' ? 'ok' : 'warning') : 'paused'} label={job.enabled ? job.lastStatus || '활성' : '일시정지'} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>}
    </div>
  )
}

function ToolGrid({ tools }: { tools: InstalledTool[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <div key={`${tool.path}-${tool.name}`} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{tool.name}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{tool.path}</p>
            </div>
            <HealthBadge health={tool.exists ? 'ok' : 'error'} label={tool.exists ? '존재' : '없음'} />
          </div>
          <p className="mt-3 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">{tool.description || '설명 없음'}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            {tool.version && <span className="rounded bg-muted px-2 py-1">{tool.version}</span>}
            <span className="rounded bg-muted px-2 py-1">{tool.status}</span>
            <span className="rounded bg-muted px-2 py-1">{tool.source}</span>
          </div>
        </div>
      ))}
      {tools.length === 0 && <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>}
    </div>
  )
}

function HealthChecks({ checks }: { checks: HealthCheck[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {checks.map((check) => (
        <div key={`${check.name}-${check.url}`} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{check.name}</p>
            <HealthBadge health={check.ok ? 'ok' : 'error'} label={check.ok ? `${check.statusCode ?? '응답'}` : '실패'} />
          </div>
          <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">{check.url}</p>
          <p className="mt-3 text-xs text-muted-foreground">응답 시간: <span className="text-foreground">{check.latencyMs !== null ? `${check.latencyMs}ms` : '—'}</span></p>
          {check.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{check.error}</p>}
        </div>
      ))}
      {checks.length === 0 && <p className="text-sm text-muted-foreground">HTTP health check 데이터가 없습니다.</p>}
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="grid gap-3 md:grid-cols-5 md:items-center">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-900 dark:bg-blue-950/30">
          <Cpu className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
          <p className="mt-2 font-semibold">DGX Spark</p>
          <p className="mt-1 text-xs text-muted-foreground">실행 환경</p>
        </div>
        <div className="hidden text-center text-2xl text-muted-foreground md:block">→</div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <Terminal className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-400" />
          <p className="mt-2 font-semibold">Local Collector</p>
          <p className="mt-1 text-xs text-muted-foreground">ss · Docker · systemd · cron</p>
        </div>
        <div className="hidden text-center text-2xl text-muted-foreground md:block">→</div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center dark:border-purple-900 dark:bg-purple-950/30">
          <Database className="mx-auto h-6 w-6 text-purple-600 dark:text-purple-400" />
          <p className="mt-2 font-semibold">Vercel + Supabase</p>
          <p className="mt-1 text-xs text-muted-foreground">스냅샷 저장 · 공개 조회</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
        <div className="rounded-lg bg-muted/60 px-3 py-2">포트별 서비스 상태</div>
        <div className="rounded-lg bg-muted/60 px-3 py-2">Docker / Systemd / Hermes</div>
        <div className="rounded-lg bg-muted/60 px-3 py-2">설치된 ~/tools 인벤토리</div>
      </div>
    </div>
  )
}

export function OperationsDashboard({ snapshot, available }: OperationsDashboardProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const filteredPorts = useMemo(() => snapshot.ports.filter(port => !normalizedQuery || [port.port, port.service, port.process, port.bind, port.category].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))), [snapshot.ports, normalizedQuery])
  const filteredDocker = useMemo(() => snapshot.docker.filter(container => !normalizedQuery || [container.name, container.image, container.status, container.ports].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))), [snapshot.docker, normalizedQuery])
  const filteredSystemd = useMemo(() => snapshot.systemd.filter(service => !normalizedQuery || [service.name, service.active, service.sub, service.description].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))), [snapshot.systemd, normalizedQuery])
  const filteredCron = useMemo(() => snapshot.cronjobs.filter(job => !normalizedQuery || [job.name, job.schedule, job.script, job.model, job.provider, job.state].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))), [snapshot.cronjobs, normalizedQuery])
  const filteredTools = useMemo(() => snapshot.tools.filter(tool => !normalizedQuery || [tool.name, tool.path, tool.version, tool.description, tool.status].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))), [snapshot.tools, normalizedQuery])

  const activeDocker = snapshot.docker.filter(container => container.health === 'ok').length
  const activeSystemd = snapshot.systemd.filter(service => service.health === 'ok').length
  const enabledCron = snapshot.cronjobs.filter(job => job.enabled).length
  const healthyChecks = snapshot.healthChecks.filter(check => check.ok).length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                  <Activity className="h-3.5 w-3.5" /> 운영 현황판
                </span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">전체 공개</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">운영중인 시스템</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                DGX Spark에서 실행 중인 포트·Docker·systemd·Hermes 크론잡과 설치된 Tools를 한 화면에서 확인합니다.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /> 마지막 수집</div>
              <p className="mt-1 font-medium">{snapshot.capturedAt ? formatDate(snapshot.capturedAt) : '수집 데이터 없음'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{snapshot.source} · {snapshot.host}</p>
            </div>
          </div>

          {!available && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div><p className="font-medium">아직 운영 스냅샷이 등록되지 않았습니다.</p><p className="mt-1 text-xs opacity-80">DGX Spark에서 `scripts/collect_operations.py --push`를 실행하면 실제 현황이 표시됩니다.</p></div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Network} label="리스닝 포트" value={snapshot.ports.length} detail="TCP listening 기준" tone="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard icon={Box} label="Docker" value={`${activeDocker}/${snapshot.docker.length}`} detail="실행 중 / 전체 컨테이너" tone="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" />
          <StatCard icon={Server} label="Systemd" value={`${activeSystemd}/${snapshot.systemd.length}`} detail="active running / 수집 대상" tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
          <StatCard icon={Clock3} label="Hermes 크론" value={`${enabledCron}/${snapshot.cronjobs.length}`} detail="활성 / 전체 등록 작업" tone="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
          <StatCard icon={Wrench} label="설치된 Tools" value={snapshot.tools.length} detail="~/tools 디렉터리 인벤토리" tone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        </section>

        <div className="sticky top-0 z-10 -mx-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex gap-1 overflow-x-auto text-xs" aria-label="운영 현황 섹션">
              {[
                ['ports', '포트'], ['docker', 'Docker'], ['systemd', 'Systemd'], ['cron', '크론잡'], ['tools', 'Tools'], ['checks', 'Health'], ['architecture', '구성도'],
              ].map(([id, label]) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted-foreground no-underline hover:bg-muted hover:text-foreground">{label}</a>)}
            </nav>
            <label className="relative block w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="서비스·포트·도구 검색" className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </label>
          </div>
        </div>

        <section className="space-y-4">
          <SectionHeading id="ports" icon={Network} title="포트별 서비스" count={filteredPorts.length} description="현재 TCP listening 상태인 서비스와 프로세스를 표시합니다." />
          <PortTable ports={filteredPorts} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="docker" icon={Box} title="Docker 컨테이너" count={filteredDocker.length} description="실행 중이거나 최근 종료된 Docker 컨테이너 목록입니다." />
          <DockerTable containers={filteredDocker} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="systemd" icon={Server} title="Systemd 서비스" count={filteredSystemd.length} description="systemctl에서 수집한 서비스 상태입니다." />
          <SystemdTable services={filteredSystemd} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="cron" icon={Clock3} title="Hermes 크론잡" count={filteredCron.length} description="활성/일시정지 여부, 스케줄, 모델, 최근 실행 결과를 표시합니다." />
          <CronTable jobs={filteredCron} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="tools" icon={Wrench} title="설치된 Tools" count={filteredTools.length} description="LOCAL_TOOLS.md에 기록된 도구와 현재 ~/tools 파일시스템의 디렉터리를 함께 보여줍니다." />
          <ToolGrid tools={filteredTools} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="checks" icon={ListChecks} title="내부 Health Check" count={healthyChecks} description="수집 시점에 로컬 HTTP 엔드포인트가 응답했는지 확인한 결과입니다." />
          <HealthChecks checks={snapshot.healthChecks} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="architecture" icon={GitBranch} title="시스템 구성도" description="로컬 실행 환경의 상태를 수집해 Vercel 공개 현황판으로 전달하는 흐름입니다." />
          <ArchitectureDiagram />
        </section>
      </main>
    </div>
  )
}
