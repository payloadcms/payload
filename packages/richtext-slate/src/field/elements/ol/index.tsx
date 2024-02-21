import React from 'react'

import type { RichTextCustomElement } from '../../..'

import OLIcon from '../../icons/OrderedList'
import ListButton from '../ListButton'
import { OrderedList } from './OrderedList'

const name = 'ol'

const ol: RichTextCustomElement = {
  name,
  Button: () => (
    <ListButton format={name}>
      <OLIcon />
    </ListButton>
  ),
  Element: OrderedList,
}

export default ol
