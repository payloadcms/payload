import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import type { Column } from 'payload'
import type { HTMLAttributes, Ref } from 'react'

export type Props = {
  readonly cellMap: Record<string, number>
  readonly columns: Column[]
  readonly dragAttributes?: HTMLAttributes<unknown>
  readonly dragListeners?: DraggableSyntheticListeners
  readonly ref?: Ref<HTMLTableRowElement>
  readonly rowId: number | string
} & HTMLAttributes<HTMLTableRowElement>

export const OrderableRow = ({
  cellMap,
  columns,
  dragAttributes = {},
  dragListeners = {},
  rowId,
  ...rest
}: Props) => (
  <tr {...rest}>
    {columns.map((col, colIndex) => {
      const { accessor } = col

      // Use the cellMap to find which index in the renderedCells to use
      const cell = col.renderedCells[cellMap[rowId]]

      // For drag handles, wrap in div with drag attributes
      if (accessor === '_dragHandle') {
        return (
          <td className={`cell-${accessor}`} key={colIndex}>
            <div {...dragAttributes} {...dragListeners}>
              {cell}
            </div>
          </td>
        )
      }

      return (
        <td className={`cell-${accessor}`} key={colIndex}>
          {cell}
        </td>
      )
    })}
  </tr>
)
