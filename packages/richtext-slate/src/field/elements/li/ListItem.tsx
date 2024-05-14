'use client'

import type { Element } from 'slate'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'
import { listTypes } from '../listTypes.js'

export const ListItemElement: React.FC = () => {
  const { attributes, children, element } = useElement<Element>()

  const listType = typeof element.children?.[0]?.type === 'string' ? element.children[0].type : ''
  const disableListStyle = element.children.length >= 1 && listTypes.includes(listType)

  return (
    <li
      style={{
        listStyle: disableListStyle ? 'none' : undefined,
        listStylePosition: disableListStyle ? 'outside' : undefined,
      }}
      {...attributes}
    >
      {children}
    </li>
  )
}
