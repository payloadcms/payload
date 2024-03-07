import React from 'react'

import type { RichTextCustomElement } from '../../../types.js'

import { H4Icon } from '../../icons/headings/H4/index.js'
import { ElementButton } from '../Button.js'
import { Heading4 } from './Heading4.js'

const name = 'h4'

export const h4: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H4Icon />
    </ElementButton>
  ),
  Element: Heading4,
}
