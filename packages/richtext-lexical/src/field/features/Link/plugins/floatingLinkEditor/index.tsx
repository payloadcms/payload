import * as React from 'react'
import { createPortal } from 'react-dom'

import { LinkEditor } from './LinkEditor'
import './index.scss'

export const FloatingLinkEditorPlugin: React.FC<{
  anchorElem?: HTMLElement
}> = ({ anchorElem = document.body }) => {
  return createPortal(<LinkEditor anchorElem={anchorElem} />, anchorElem)
}
