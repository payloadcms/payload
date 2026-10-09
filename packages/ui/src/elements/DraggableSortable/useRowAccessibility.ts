import type { Announcements, UniqueIdentifier } from '@dnd-kit/core'
import type { RefObject } from 'react'

import { computeAccessibleName } from 'dom-accessibility-api'
import { useMemo, useRef } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'

/** Keep the picked-up row's name stable while its displayed ordinal changes. */
export function useRowAccessibility({
  containerRef,
  enabled,
  ids,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  enabled: boolean
  ids: string[]
}) {
  const { t } = useTranslation()
  const pickedUpLabel = useRef('')
  const previousPosition = useRef(0)

  return useMemo(() => {
    if (!enabled) {
      return undefined
    }

    const position = ({ id }: { id: UniqueIdentifier }) => ids.indexOf(String(id)) + 1
    const getLabel = ({ id }: { id: UniqueIdentifier }) => {
      const handle = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>('[data-sortable-id]') || [],
      ).find((element) => element.dataset.sortableId === String(id))
      const name = handle ? computeAccessibleName(handle) : ''
      const action = t('general:dragToReorder')
      const label = name.startsWith(action) ? name.slice(action.length).trim() : name

      return label || t('general:row')
    }
    const announcements: Announcements = {
      onDragCancel() {
        return t('general:dragCancelled', { label: pickedUpLabel.current })
      },
      onDragEnd({ over }) {
        if (!over) {
          return t('general:dragCancelled', { label: pickedUpLabel.current })
        }
        return t('general:dragDropped', {
          count: ids.length,
          label: pickedUpLabel.current,
          position: previousPosition.current,
        })
      },
      onDragOver({ over }) {
        if (!over) {
          return
        }
        const nextPosition = position({ id: over.id })

        if (!nextPosition || nextPosition === previousPosition.current) {
          return
        }
        const direction = t(
          nextPosition > previousPosition.current ? 'general:moveDown' : 'general:moveUp',
        )

        previousPosition.current = nextPosition
        return t('general:dragMoved', {
          count: ids.length,
          direction,
          label: pickedUpLabel.current,
          position: nextPosition,
        })
      },
      onDragStart({ active }) {
        pickedUpLabel.current = getLabel({ id: active.id })
        previousPosition.current = position({ id: active.id })
        return t('general:dragPickedUp', {
          count: ids.length,
          label: pickedUpLabel.current,
          position: previousPosition.current,
        })
      },
    }

    return {
      announcements,
      screenReaderInstructions: { draggable: t('general:dragInstructions') },
    }
  }, [containerRef, enabled, ids, t])
}
