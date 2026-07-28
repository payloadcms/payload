'use client'
import { DevCompileStatusContext } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { ViteHotContext } from './listener.js'

import { connectDevCompileStatus } from './listener.js'

export const TanStackDevCompileStatusAdapter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isCompiling, setIsCompiling] = useState(false)

  useEffect(() => {
    const hot = (import.meta as unknown as { hot?: ViteHotContext }).hot
    return connectDevCompileStatus({ hot, onChange: setIsCompiling })
  }, [])

  return <DevCompileStatusContext value={{ isCompiling }}>{children}</DevCompileStatusContext>
}
