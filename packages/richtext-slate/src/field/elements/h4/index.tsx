import React from 'react'

import type { RichTextCustomElement } from '../../..'

import H4Icon from '../../icons/headings/H4'
import ElementButton from '../Button'
import { Heading4 } from './Heading4'

const name = 'h4'

const h4: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H4Icon />
    </ElementButton>
  ),
  Element: Heading4,
}

export default h4
