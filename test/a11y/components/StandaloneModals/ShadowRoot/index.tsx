'use client'

import type { ReactNode } from 'react'

import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

export function ShadowRoot({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current!
    const outerRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    const outerBackground = document.createElement('button')

    outerBackground.textContent = 'Outer shadow background'
    outerBackground.dataset.testid = 'outer-shadow-background'
    outerBackground.setAttribute('aria-hidden', 'false')

    const innerHost = document.createElement('div')

    innerHost.dataset.testid = 'inner-shadow-host'
    outerRoot.append(outerBackground, innerHost)

    const shadow = innerHost.attachShadow({ mode: 'open' })
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], head > style'))

    shadow.append(...styles.map((style) => style.cloneNode(true)))

    const existingInert = document.createElement('button')

    existingInert.dataset.testid = 'shadow-existing-inert'
    existingInert.textContent = 'Previously inert'
    existingInert.setAttribute('inert', 'preserved')
    existingInert.setAttribute('aria-hidden', 'false')

    const existingHidden = document.createElement('div')

    existingHidden.dataset.testid = 'shadow-existing-hidden'
    existingHidden.setAttribute('aria-hidden', 'true')
    existingHidden.textContent = 'Previously hidden'

    const mount = document.createElement('div')

    shadow.append(existingInert, existingHidden, mount)

    const root = createRoot(mount)

    root.render(children)

    return () => {
      root.unmount()
      outerRoot.replaceChildren()
    }
  }, [children])

  return (
    <>
      <button data-testid="document-background" type="button">
        Host page action
      </button>
      <div aria-hidden="false" data-testid="document-prior-hidden">
        Host page content
      </div>
      <div data-testid="shadow-host" ref={hostRef} />
    </>
  )
}
