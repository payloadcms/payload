import * as React from 'react'

import type { SanitizedPlugin } from '../features/types.js'

export const EditorPlugin: React.FC<{
  anchorElem?: HTMLDivElement
  plugin: SanitizedPlugin
}> = ({ anchorElem, plugin }) => {
  if (plugin.position === 'floatingAnchorElem') {
    return plugin.Component && <plugin.Component anchorElem={anchorElem} />
  }

  return plugin.Component && <plugin.Component />
}
