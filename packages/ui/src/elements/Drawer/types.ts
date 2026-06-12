import type { HTMLAttributes } from 'react'

export type DrawerHeaderAction = {
  readonly disabled?: boolean
  readonly label: string
  readonly onClick: () => void
  readonly style?: 'dashed' | 'destructive' | 'ghost' | 'pill' | 'primary' | 'secondary'
}

export type Props = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly Header?: React.ReactNode
  readonly headerActions?: ReadonlyArray<DrawerHeaderAction>
  readonly hoverTitle?: boolean
  readonly slug: string
  readonly title?: string
}

export type TogglerProps = {
  buttonStyle?: 'dashed' | 'destructive' | 'ghost' | 'pill' | 'primary' | 'secondary'
  children: React.ReactNode
  className?: string
  disabled?: boolean
  extraButtonProps?: Record<string, any>
  slug: string
} & HTMLAttributes<HTMLButtonElement>
