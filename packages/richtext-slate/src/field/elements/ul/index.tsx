import React from 'react'

import type { RichTextCustomElement } from '../../..'

import ULIcon from '../../icons/UnorderedList'
import ListButton from '../ListButton'
import { UnorderedList } from './UnorderedList'

const name = 'ul'

const ul: RichTextCustomElement = {
  name,
  Button: () => (
    <ListButton format={name}>
      <ULIcon />
    </ListButton>
  ),
  Element: UnorderedList,
}

export default ul
