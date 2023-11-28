import * as React from 'react'

import type { SanitizedPlugin } from '../features/types'

export const EditorPlugin: React.FC<{
  anchorElem?: HTMLDivElement
  plugin: SanitizedPlugin
}> = ({ anchorElem, plugin }) => {
  const Component: React.FC<any> = plugin?.Component
    ? React.lazy(() =>
        plugin.Component().then((resolvedComponent) => ({
          default: resolvedComponent,
        })),
      )
    : null

  if (plugin.position === 'floatingAnchorElem') {
    return (
      Component && (
        <React.Suspense>
          <Component anchorElem={anchorElem} />
        </React.Suspense>
      )
    )
  }

  return (
    Component && (
      <React.Suspense>
        <Component />
      </React.Suspense>
    )
  )
}
