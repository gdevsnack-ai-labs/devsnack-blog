'use client'

import { track } from '@vercel/analytics'

type EventValue = string | number | boolean

export function trackSiteEvent(name: string, properties?: Record<string, EventValue>) {
  void track(name, properties)
}
