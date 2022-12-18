import { ElementType } from 'react';

export type ButtonProps = {
  format: string
  onClick?: (e: React.MouseEvent) => void
  className?: string
  children?: React.ReactNode
  tooltip?: string
  el?: ElementType
}
