import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import { H6Icon } from '../../icons/headings/H6/index.js'
import { ElementButton } from '../Button.js'
import { Heading6 } from './Heading6.js'

const name = 'h6'

export const h6: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H6Icon />
    </ElementButton>
  ),
  Element: Heading6,
}
