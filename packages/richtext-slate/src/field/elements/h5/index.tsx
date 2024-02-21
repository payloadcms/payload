import React from 'react'

import type { RichTextCustomElement } from '../../..'

import H5Icon from '../../icons/headings/H5'
import ElementButton from '../Button'
import { Heading5 } from './Heading5'

const name = 'h5'

const h5: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H5Icon />
    </ElementButton>
  ),
  Element: Heading5,
}

export default h5
