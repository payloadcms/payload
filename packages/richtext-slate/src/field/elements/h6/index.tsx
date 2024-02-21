import React from 'react'

import type { RichTextCustomElement } from '../../..'

import H6Icon from '../../icons/headings/H6'
import ElementButton from '../Button'
import { Heading6 } from './Heading6'

const name = 'h6'

const h6: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H6Icon />
    </ElementButton>
  ),
  Element: Heading6,
}

export default h6
