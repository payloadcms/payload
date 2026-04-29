import type { HTMLAttributes } from 'react'

export type DrawerHeaderAction = {
  readonly disabled?: boolean
  readonly label: string
  readonly onClick: () => void
  readonly style?:
    | 'dashed'
    | 'destructive'
    | 'ghost'
    | 'icon-label'
    | 'none'
    | 'pill'
    | 'primary'
    | 'secondary'
    | 'subtle'
    | 'tab'
}

export type Props = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly gutter?: boolean
  readonly Header?: React.ReactNode
  readonly headerActions?: ReadonlyArray<DrawerHeaderAction>
  readonly hoverTitle?: boolean
  readonly slug: string
  readonly title?: string
}

export type TogglerProps = {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  slug: string
} & HTMLAttributes<HTMLButtonElement>
