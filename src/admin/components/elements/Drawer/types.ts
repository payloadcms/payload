import { HTMLAttributes } from 'react';

export type Props = {
  slug: string
  formatSlug?: boolean
  children: React.ReactNode
}

export type TogglerProps = HTMLAttributes<HTMLButtonElement> & {
  slug: string
  formatSlug?: boolean
  children: React.ReactNode
  className?: string
}
