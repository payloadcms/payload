import { HTMLAttributes } from 'react';

export type Props = {
  children?: React.ReactNode,
  className?: string,
  to?: string,
  icon?: React.ReactNode,
  alignIcon?: 'left' | 'right',
  onClick?: () => void,
  pillStyle?: 'white' | 'light' | 'dark' | 'light-gray' | 'warning' | 'success' | 'error',
  draggable?: boolean,
  rounded?: boolean
  id?: string
  'aria-label'?: string,
  'aria-expanded'?: boolean,
  'aria-controls'?: string,
  'aria-checked'?: boolean,
  elementProps?: HTMLAttributes<HTMLElement> & {
    ref: React.RefCallback<HTMLElement>
  }
}

export type RenderedTypeProps = {
  children: React.ReactNode
  className?: string,
  to: string,
  onClick?: () => void,
  type?: 'button'
}
