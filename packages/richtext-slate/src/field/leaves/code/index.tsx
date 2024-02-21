import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import CodeIcon from '../../icons/Code'
import LeafButton from '../Button'
import { Code } from './Code'

const code: RichTextCustomLeaf = {
  name: 'code',
  Button: () => (
    <LeafButton format="code">
      <CodeIcon />
    </LeafButton>
  ),
  Leaf: Code,
}

export default code
