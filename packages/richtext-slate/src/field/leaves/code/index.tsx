import React from 'react'

import CodeIcon from '../../icons/Code'
import LeafButton from '../Button'

const Code = ({ attributes, children }) => <code {...attributes}>{children}</code>

const code = {
  Button: () => (
    <LeafButton format="code">
      <CodeIcon />
    </LeafButton>
  ),
  Leaf: Code,
}

export default code
