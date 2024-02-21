import React from 'react'

import type { RichTextCustomElement } from '../../..'

import H1Icon from '../../icons/headings/H1'
import ElementButton from '../Button'
import { Heading1 } from './Heading1'

const name = 'h1'

const h1: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H1Icon />
    </ElementButton>
  ),
  Element: Heading1,
}

export default h1
