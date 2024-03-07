import React from 'react'

import type { RichTextCustomElement } from '../../../types.js'

import { H3Icon } from '../../icons/headings/H3/index.js'
import { ElementButton } from '../Button.js'
import { Heading3 } from './Heading3.js'

const name = 'h3'

export const h3: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H3Icon />
    </ElementButton>
  ),
  Element: Heading3,
}
