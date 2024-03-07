'use client'

import type React from 'react'

import { usePathname, useRouter } from 'next/navigation.js'
import { useEffect } from 'react'

export const ClearRouteCache: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    router.refresh()
  }, [pathname, router])

  return null
}
