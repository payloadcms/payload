import React from 'react'

import type { RichTextCustomLeaf } from '../../../types.d.ts'

import { CodeIcon } from '../../icons/Code/index.js'
import { LeafButton } from '../Button.js'
import { Code } from './Code/index.js'

export const code: RichTextCustomLeaf = {
  name: 'code',
  Button: () => (
    <LeafButton format="code">
      <CodeIcon />
    </LeafButton>
  ),
  Leaf: Code,
}
