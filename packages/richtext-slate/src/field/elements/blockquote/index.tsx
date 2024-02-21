import React from 'react'

import type { RichTextCustomElement } from '../../..'

import BlockquoteIcon from '../../icons/Blockquote'
import ElementButton from '../Button'
import { Blockquote } from './Blockquote'

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
