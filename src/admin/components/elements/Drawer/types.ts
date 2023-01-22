import { HTMLAttributes } from 'react';

export type Props = {
  slug: string
  children: React.ReactNode
  className?: string
}

export type TogglerProps = HTMLAttributes<HTMLButtonElement> & {
  slug: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}
