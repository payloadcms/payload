'use client'
import { DevCompileStatusContext } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { buildDevCompileStatusUrl, connectDevCompileStatus } from './devCompileStatus.js'

export const NextDevCompileStatusAdapter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isCompiling, setIsCompiling] = useState(false)

  useEffect(() => {
    return connectDevCompileStatus({ onChange: setIsCompiling, url: buildDevCompileStatusUrl() })
  }, [])

  return <DevCompileStatusContext value={{ isCompiling }}>{children}</DevCompileStatusContext>
}
