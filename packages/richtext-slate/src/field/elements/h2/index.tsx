import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import { H2Icon } from '../../icons/headings/H2/index.js'
import { ElementButton } from '../Button.js'
import { Heading2 } from './Heading2.js'

const name = 'h2'

export const h2: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H2Icon />
    </ElementButton>
  ),
  Element: Heading2,
}
