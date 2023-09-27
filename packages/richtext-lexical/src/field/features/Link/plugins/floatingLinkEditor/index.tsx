import * as React from 'react'
import { createPortal } from 'react-dom'

import type { LinkProps } from '../..'

import { LinkEditor } from './LinkEditor'
import './index.scss'

export const FloatingLinkEditorPlugin: React.FC<
  {
    anchorElem?: HTMLElement
  } & LinkProps
> = ({ anchorElem = document.body }) => {
  return createPortal(<LinkEditor anchorElem={anchorElem} />, anchorElem)
}
