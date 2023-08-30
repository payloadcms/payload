import React from 'react'

import BlockquoteIcon from '../../../../../icons/Blockquote/index.js'
import ElementButton from '../Button.js'
import './index.scss'

const Blockquote = ({ attributes, children }) => (
  <blockquote className="rich-text-blockquote" {...attributes}>
    {children}
  </blockquote>
)

const blockquote = {
  Button: () => (
    <ElementButton format="blockquote">
      <BlockquoteIcon />
    </ElementButton>
  ),
  Element: Blockquote,
}

export default blockquote
