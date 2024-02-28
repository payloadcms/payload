'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'

import type { ClientProps } from '../../feature.client'

import { LinkEditor } from './LinkEditor'
import './index.scss'

export const FloatingLinkEditorPlugin: React.FC<
  {
    anchorElem: HTMLElement
  } & ClientProps
> = (props) => {
  const { anchorElem = document.body } = props

  return createPortal(<LinkEditor {...props} anchorElem={anchorElem} />, anchorElem)
}
