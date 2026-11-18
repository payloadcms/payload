/* oxlint-disable payload/no-relative-monorepo-imports -- Shadow roots need private component CSS, which has no public export. */
import type { ReactNode } from 'react'
import type { Locator } from 'vitest/browser'

import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { expect } from 'vitest'

import buttonStyles from '../../../../packages/ui/src/elements/Button/index.css?inline'
import popupStyles from '../../../../packages/ui/src/elements/Popup/index.css?inline'
import listStyles from '../../../../packages/ui/src/elements/Popup/PopupButtonList/index.css?inline'
import submenuStyles from '../../../../packages/ui/src/elements/Popup/PopupButtonList/SubmenuTrigger/index.css?inline'
import triggerStyles from '../../../../packages/ui/src/elements/Popup/PopupTrigger/index.css?inline'
import baseStyles from '../../../../packages/ui/src/styles.css?inline'

const styles = [
  baseStyles,
  buttonStyles,
  popupStyles,
  listStyles,
  submenuStyles,
  triggerStyles,
].join('\n')

// The DOM focus matcher reads document.activeElement instead of the shadow root.
export const expectFocus = ({ locator }: { locator: Locator }) =>
  expect.poll(() => locator.element().matches(':focus')).toBe(true)

export function PopupTestRoot({
  children,
  isShadowRoot = false,
}: {
  children: ReactNode
  isShadowRoot?: boolean
}) {
  const [shadowRoot, setShadowRoot] = useState<null | ShadowRoot>(null)
  const attachShadow = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      setShadowRoot(element.shadowRoot ?? element.attachShadow({ mode: 'open' }))
    }
  }, [])

  if (!isShadowRoot) {
    return children
  }

  return (
    <div data-testid="shadow-host" ref={attachShadow}>
      {shadowRoot &&
        createPortal(
          <>
            <style>{styles}</style>
            {children}
          </>,
          shadowRoot,
        )}
    </div>
  )
}
