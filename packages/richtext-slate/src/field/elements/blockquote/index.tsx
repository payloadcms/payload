import React from 'react'

import BlockquoteIcon from '../../icons/Blockquote'
import ElementButton from '../Button'
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
