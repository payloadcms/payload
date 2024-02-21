import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import CodeIcon from '../../icons/Code'
import { useLeaf } from '../../providers/LeafProvider'
import LeafButton from '../Button'

const Code = () => {
  const { attributes, children } = useLeaf()
  return <code {...attributes}>{children}</code>
}

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
