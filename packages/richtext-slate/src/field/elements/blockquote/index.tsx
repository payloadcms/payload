import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import BlockquoteIcon from '../../icons/Blockquote/index.js'
import ElementButton from '../Button.js'
import { Blockquote } from './Blockquote.js'

const name = 'blockquote'

const blockquote: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <BlockquoteIcon />
    </ElementButton>
  ),
  Element: Blockquote,
}

export default blockquote
