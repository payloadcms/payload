import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import { BlockquoteIcon } from '../../icons/Blockquote/index.js'
import { ElementButton } from '../Button.js'
import { Blockquote } from './Blockquote.js'

const name = 'blockquote'

export const blockquote: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <BlockquoteIcon />
    </ElementButton>
  ),
  Element: Blockquote,
}
