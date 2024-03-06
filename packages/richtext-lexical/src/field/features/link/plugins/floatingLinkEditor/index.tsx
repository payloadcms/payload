'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { LinkEditor } from './LinkEditor/index.js'
import './index.scss'

export const FloatingLinkEditorPlugin: React.FC<{
  anchorElem: HTMLElement
}> = (props) => {
  const { anchorElem = document.body } = props

  return createPortal(<LinkEditor anchorElem={anchorElem} />, anchorElem)
}
