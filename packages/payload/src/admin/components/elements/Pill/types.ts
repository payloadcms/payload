import type { HTMLAttributes } from 'react'

export type Props = {
  alignIcon?: 'left' | 'right'
  'aria-checked'?: boolean
  'aria-controls'?: string
  'aria-expanded'?: boolean
  'aria-label'?: string
  children?: React.ReactNode
  className?: string
  draggable?: boolean
  elementProps?: HTMLAttributes<HTMLElement> & {
    ref: React.RefCallback<HTMLElement>
  }
  icon?: React.ReactNode
  id?: string
  onClick?: () => void
  pillStyle?: 'dark' | 'error' | 'light' | 'light-gray' | 'success' | 'warning' | 'white'
  rounded?: boolean
  to?: string
}

export type RenderedTypeProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  to: string
  type?: 'button'
}
