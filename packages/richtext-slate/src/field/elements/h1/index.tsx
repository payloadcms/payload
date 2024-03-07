import React from 'react'

import type { RichTextCustomElement } from '../../../types.js'

import { H1Icon } from '../../icons/headings/H1/index.js'
import { ElementButton } from '../Button.js'
import { Heading1 } from './Heading1.js'

const name = 'h1'

export const h1: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H1Icon />
    </ElementButton>
  ),
  Element: Heading1,
}
