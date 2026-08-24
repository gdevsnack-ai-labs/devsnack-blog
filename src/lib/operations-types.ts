export type OperationsHealth = 'ok' | 'warning' | 'error' | 'unknown'

export interface OperationPort {
  port: number
  protocol: string
  bind: string
  process: string
  service: string
  category: string
  health: OperationsHealth
}

export interface DockerContainer {
  name: string
  image: string
  status: string
  ports: string
  health: OperationsHealth
}

export interface SystemdService {
  name: string
  scope: 'system' | 'user'
  unitType: 'service' | 'target'
  load: string
  active: string
  sub: string
  description: string
  health: OperationsHealth
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  state: string
  lastStatus: string
  lastRunAt: string | null
  nextRunAt: string | null
  script: string | null
  noAgent: boolean
  model: string | null
  provider: string | null
  workdir: string | null
}

export interface InstalledTool {
  name: string
  path: string
  version: string | null
  description: string
  source: string
  exists: boolean
  status: string
}

export interface HealthCheck {
  name: string
  url: string
  statusCode: number | null
  latencyMs: number | null
  ok: boolean
  error: string | null
}

export interface OperationsSnapshot {
  capturedAt: string
  source: string
  host: string
  ports: OperationPort[]
  docker: DockerContainer[]
  systemd: SystemdService[]
  cronjobs: CronJob[]
  tools: InstalledTool[]
  healthChecks: HealthCheck[]
}

export const EMPTY_OPERATIONS_SNAPSHOT: OperationsSnapshot = {
  capturedAt: '',
  source: 'not-collected',
  host: 'DGX Spark GB10',
  ports: [],
  docker: [],
  systemd: [],
  cronjobs: [],
  tools: [],
  healthChecks: [],
}

function arrayOrEmpty<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

export function normalizeOperationsSnapshot(value: unknown): OperationsSnapshot {
  if (!value || typeof value !== 'object') return EMPTY_OPERATIONS_SNAPSHOT
  const raw = value as Partial<OperationsSnapshot>
  return {
    capturedAt: typeof raw.capturedAt === 'string' ? raw.capturedAt : '',
    source: typeof raw.source === 'string' ? raw.source : 'unknown',
    host: typeof raw.host === 'string' ? raw.host : 'DGX Spark GB10',
    ports: arrayOrEmpty<OperationPort>(raw.ports),
    docker: arrayOrEmpty<DockerContainer>(raw.docker),
    systemd: arrayOrEmpty<SystemdService>(raw.systemd).map((service) => ({
      ...service,
      scope: service.scope === 'user' ? 'user' : 'system',
      unitType: service.unitType === 'target' ? 'target' : 'service',
    })),
    cronjobs: arrayOrEmpty<CronJob>(raw.cronjobs),
    tools: arrayOrEmpty<InstalledTool>(raw.tools),
    healthChecks: arrayOrEmpty<HealthCheck>(raw.healthChecks),
  }
}
