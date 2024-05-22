'use client'
import type { IndicatorsContainerProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

export const IndicatorsContainer: React.FC<IndicatorsContainerProps> = (props) => {
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return <SelectComponents.IndicatorsContainer {...props} />
}
