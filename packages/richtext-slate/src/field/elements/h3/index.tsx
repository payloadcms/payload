import React from 'react'

import type { RichTextCustomElement } from '../../..'

import H3Icon from '../../icons/headings/H3'
import ElementButton from '../Button'
import { Heading3 } from './Heading3'

const name = 'h3'

const h3: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H3Icon />
    </ElementButton>
  ),
  Element: Heading3,
}

export default h3
