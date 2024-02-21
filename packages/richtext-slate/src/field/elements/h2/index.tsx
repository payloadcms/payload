import React from 'react'

import type { RichTextCustomElement } from '../../..'

import H2Icon from '../../icons/headings/H2'
import ElementButton from '../Button'
import { Heading2 } from './Heading2'

const name = 'h2'

const h2: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H2Icon />
    </ElementButton>
  ),
  Element: Heading2,
}

export default h2
