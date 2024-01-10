import type React from 'react'

export type Props = {
  CustomComponent?: React.ComponentType<any> | Promise<React.ComponentType<any>>
  DefaultComponent: React.ComponentType<any> | Promise<React.ComponentType<any>>
  componentProps?: Record<string, unknown>
}
