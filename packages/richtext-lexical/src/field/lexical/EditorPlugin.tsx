import * as React from 'react'

import type { SanitizedPlugin } from '../features/types'

export const EditorPlugin: React.FC<{
  anchorElem?: HTMLDivElement
  plugin: SanitizedPlugin
}> = ({ anchorElem, plugin }) => {
  if (plugin.position === 'floatingAnchorElem') {
    return (
      plugin.Component && (
        <React.Suspense>
          <plugin.Component anchorElem={anchorElem} />
        </React.Suspense>
      )
    )
  }

  return (
    plugin.Component && (
      <React.Suspense>
        <plugin.Component />
      </React.Suspense>
    )
  )
}
