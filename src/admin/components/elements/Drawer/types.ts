import { HTMLAttributes } from 'react';

export type Props = {
  slug: string
  exactSlug?: boolean
  children: React.ReactNode
}

export type TogglerProps = HTMLAttributes<HTMLButtonElement> & {
  slug: string
  exactSlug?: boolean
  children: React.ReactNode
  className?: string
}
