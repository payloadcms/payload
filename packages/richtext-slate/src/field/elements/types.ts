import type { ElementType } from 'react'

export type ButtonProps = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  el?: ElementType
  format: string
  onClick?: (e: React.MouseEvent) => void
  tooltip?: string
  type?: string
}
