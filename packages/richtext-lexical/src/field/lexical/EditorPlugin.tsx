import * as React from 'react'

import type { SanitizedPlugin } from '../features/types.js'

export const EditorPlugin: React.FC<{
  anchorElem?: HTMLDivElement
  clientProps: any
  plugin: SanitizedPlugin
}> = ({ anchorElem, clientProps, plugin }) => {
  if (plugin.position === 'floatingAnchorElem') {
    return (
      plugin.Component && <plugin.Component anchorElem={anchorElem} clientProps={clientProps} />
    )
  }

  return plugin.Component && <plugin.Component clientProps={clientProps} />
}
