import type { MouseEvent } from 'react'

type onClick = (event: MouseEvent) => void

export type Props = {
  alignIcon?: 'left' | 'right'
  children?: React.ReactNode
  className?: string
  icon?: React.ReactNode
  onClick?: onClick
  to?: string
  type?: 'default' | 'error' | 'info' | 'success'
}

export type RenderedTypeProps = {
  children?: React.ReactNode
  className?: string
  onClick?: onClick
  to: string
}
