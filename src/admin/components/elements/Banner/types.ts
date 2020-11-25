import { MouseEvent } from 'react';

export type Props = {
  children?: React.ReactNode,
  className?: string,
  icon?: React.ReactNode,
  alignIcon?: 'left' | 'right',
  onClick?: (event: MouseEvent) => void,
  to?: string,
  type?: 'error' | 'success' | 'info' | 'default',
}
