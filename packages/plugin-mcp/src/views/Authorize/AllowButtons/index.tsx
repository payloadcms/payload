'use client'

import { Button } from '@payloadcms/ui'
import React, { useEffect, useState, useSyncExternalStore } from 'react'

const baseClass = 'mcp-authorize'

/** How long the page must have been in front of the user before the buttons work, in ms. */
const enableDelay = 1000

// Whether the page is inside a frame never changes, so there's nothing to subscribe to
const subscribe = () => () => {}

/**
 * The Allow and Deny buttons, protected against clicks the user didn't mean for this page:
 *
 * - Inside a frame they aren't shown, so other sites can't frame the page and trick users into
 *   clicking them. The server can't tell, so they're missing until the browser has checked.
 * - They're disabled until the page has been visible and focused for a moment. Otherwise another
 *   site could open the page under the user's cursor while they double-click something else, so
 *   the second click lands on Allow. Leaving the page disables them again. Waiting works for every
 *   way of clicking, unlike requiring a mouse movement or key press first.
 *
 * @see https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-17#section-7.11 for why the
 * OAuth server must prevent clickjacking
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html#defending-against-doubleclickjacking
 * for the double-click attack and its mitigation
 */
export function AllowButtons() {
  const isTopLevel = useSyncExternalStore(
    subscribe,
    () => window.top === window.self,
    () => false,
  )
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    const enableAfterDelay = () => {
      clearTimeout(timeout)
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        timeout = setTimeout(() => setIsEnabled(true), enableDelay)
      }
    }
    const disable = () => {
      clearTimeout(timeout)
      setIsEnabled(false)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        enableAfterDelay()
      } else {
        disable()
      }
    }

    enableAfterDelay()
    window.addEventListener('focus', enableAfterDelay)
    window.addEventListener('blur', disable)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('focus', enableAfterDelay)
      window.removeEventListener('blur', disable)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  if (!isTopLevel) {
    return null
  }

  return (
    <div className={`${baseClass}__actions`}>
      <Button
        buttonStyle="primary"
        disabled={!isEnabled}
        extraButtonProps={{ name: 'decision', value: 'allow' }}
        margin={false}
        type="submit"
      >
        Allow
      </Button>
      <Button
        buttonStyle="secondary"
        disabled={!isEnabled}
        extraButtonProps={{ name: 'decision', value: 'deny' }}
        margin={false}
        type="submit"
      >
        Deny
      </Button>
    </div>
  )
}
