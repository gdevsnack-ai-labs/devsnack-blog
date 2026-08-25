'use client'

import { useEffect } from 'react'

export function EnglishLanguageMarker() {
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])
  return null
}
