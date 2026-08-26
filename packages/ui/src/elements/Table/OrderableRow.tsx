import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import type { Column } from 'payload'
import type { HTMLAttributes, KeyboardEvent, Ref } from 'react'

export type Props = {
  readonly cellMap: Record<string, number>
  readonly columns: Column[]
  readonly dragAttributes?: HTMLAttributes<unknown>
  readonly dragListeners?: DraggableSyntheticListeners
  readonly isOrderable?: boolean
  readonly onDisabledDragAttempt?: () => void
  readonly ref?: Ref<HTMLTableRowElement>
  readonly rowId: number | string
} & HTMLAttributes<HTMLTableRowElement>

export const OrderableRow = ({
  cellMap,
  columns,
  dragAttributes = {},
  dragListeners = {},
  isOrderable = true,
  onDisabledDragAttempt,
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
        // When not orderable, dnd-kit's own drag listeners are disabled, so pressing the keys
        // it would normally use to start a drag does nothing silently. Intercept them here to
        // tell the user why instead.
        const dragHandleListeners = {
          ...dragListeners,
          onKeyDown: (event: KeyboardEvent) => {
            if (!isOrderable && (event.code === 'Space' || event.code === 'Enter')) {
              event.preventDefault()
              onDisabledDragAttempt?.()
              return
            }

            dragListeners?.onKeyDown?.(event)
          },
        }

        return (
          <td className={`cell-${accessor}`} key={colIndex}>
            <div {...dragAttributes} {...dragHandleListeners}>
              {cell}
            </div>
          </td>
        )
      }

      return (
        <td
          className={[`cell-${accessor}`, col.isLinkedColumn && 'cell--linked']
            .filter(Boolean)
            .join(' ')}
          key={colIndex}
        >
          {cell}
        </td>
      )
    })}
  </tr>
)
