'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { ArrowIcon } from '../../../icons/Arrow/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import './index.css'

const baseClass = 'hierarchy-actions-menu'

/**
 * Props for the trigger button. `undefined` when the menu is off and the trigger
 * should run its own click handler instead.
 */
export type HierarchyActionsMenuTriggerProps =
  | {
      extraButtonProps: {
        'aria-controls'?: string
        'aria-expanded'?: 'false' | 'true' | boolean
        'aria-haspopup': 'menu'
        onKeyDown: React.KeyboardEventHandler
      }
      onClick: React.MouseEventHandler
      selected: boolean
    }
  | undefined

export type HierarchyActionsMenuProps = {
  /** Destination for the "Go to" action. The action is hidden when omitted. */
  goTo?: { href: string; name: string }
  /** When false, the trigger renders without a menu. */
  hasActions: boolean
  /** Singular label of the hierarchy collection, used in the remove action. */
  hierarchyLabel: string
  onMove: () => void
  /** Return `false` when the remove failed, so focus stays where it is. */
  onRemove: () => boolean | Promise<boolean> | void
  renderTrigger: (triggerProps: HierarchyActionsMenuTriggerProps) => React.ReactNode
  /** Show icons next to the move and remove actions. */
  showActionIcons?: boolean
}

export const HierarchyActionsMenu: React.FC<HierarchyActionsMenuProps> = ({
  goTo,
  hasActions,
  hierarchyLabel,
  onMove,
  onRemove,
  renderTrigger,
  showActionIcons = false,
}) => {
  const { t } = useTranslation()
  const controlRef = useRef<HTMLDivElement | null>(null)
  const [shouldRefocus, setShouldRefocus] = useState(false)

  // After a remove, the trigger re-renders without the menu, so focus the new button
  useEffect(() => {
    if (shouldRefocus) {
      controlRef.current?.querySelector('button')?.focus()
      setShouldRefocus(false)
    }
  }, [shouldRefocus])

  const handleRemove = useCallback(async () => {
    if ((await onRemove()) !== false) {
      setShouldRefocus(true)
    }
  }, [onRemove])

  return (
    <div className={baseClass} ref={controlRef}>
      {hasActions ? (
        <Popup
          caret={false}
          horizontalAlign="left"
          portalClassName={`${baseClass}__popup-content`}
          render={({ close }) => (
            <PopupList.MenuItem>
              <PopupList.Button
                icon={showActionIcons ? <ArrowIcon direction="right" /> : undefined}
                onClick={() => {
                  close()
                  requestAnimationFrame(onMove)
                }}
              >
                {t('hierarchy:moveTo')}
              </PopupList.Button>
              <PopupList.Button
                icon={showActionIcons ? <XIcon /> : undefined}
                onClick={() => {
                  close()
                  void handleRemove()
                }}
              >
                {t('hierarchy:removeFrom', { label: hierarchyLabel })}
              </PopupList.Button>
              {goTo ? (
                <React.Fragment>
                  <PopupList.Divider />
                  <PopupList.Button href={goTo.href} onClick={close}>
                    <span className={`${baseClass}__truncate`} title={goTo.name}>
                      {t('hierarchy:goTo', { name: goTo.name })}
                    </span>
                  </PopupList.Button>
                </React.Fragment>
              ) : null}
            </PopupList.MenuItem>
          )}
          renderButton={({ active, 'aria-controls': ariaControls, onClick, onKeyDown }) =>
            renderTrigger({
              extraButtonProps: {
                'aria-controls': ariaControls,
                'aria-expanded': active,
                'aria-haspopup': 'menu',
                onKeyDown,
              },
              onClick,
              selected: active,
            })
          }
          size="fit-content"
          verticalAlign="bottom"
        />
      ) : (
        renderTrigger(undefined)
      )}
    </div>
  )
}
