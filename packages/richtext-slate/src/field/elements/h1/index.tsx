import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import H1Icon from '../../icons/headings/H1/index.js'
import ElementButton from '../Button.js'
import { Heading1 } from './Heading1.js'

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
