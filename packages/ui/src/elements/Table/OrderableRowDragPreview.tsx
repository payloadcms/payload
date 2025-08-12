import type { ReactNode } from 'react'

export type Props = {
  readonly children: ReactNode
  readonly className?: string
  readonly rowId?: number | string
}

export const OrderableRowDragPreview = ({ children, className, rowId }: Props) =>
  typeof rowId === 'undefined' ? null : (
    <div className={className}>
      <table cellPadding={0} cellSpacing={0}>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
