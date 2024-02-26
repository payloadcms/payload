import type React from 'react'

export type Props = {
  CustomComponent?: Promise<React.ComponentType<any>> | React.ComponentType<any>
  DefaultComponent: Promise<React.ComponentType<any>> | React.ComponentType<any>
  componentProps?: Record<string, unknown>
}
