import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import BoldIcon from '../../icons/Bold'
import LeafButton from '../Button'
import { Bold } from './Bold'

const bold: RichTextCustomLeaf = {
  name: 'bold',
  Button: () => (
    <LeafButton format="bold">
      <BoldIcon />
    </LeafButton>
  ),
  Leaf: Bold,
}

export default bold
