import type { LucideIcon } from 'lucide-react'

interface HubHeaderProps {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}

export function HubHeader({ eyebrow, title, description, icon: Icon }: HubHeaderProps) {
  return (
    <header className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {eyebrow}
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
    </header>
  )
}
