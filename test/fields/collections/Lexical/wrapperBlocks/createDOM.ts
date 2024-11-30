'use client'

import type { CreateDOMFunction } from '@payloadcms/richtext-lexical'

export const wrapperBlockCreateDOM: CreateDOMFunction = ({ editorConfig, editor, node }) => {
  console.log('Node fields', node.getFields())
  const a = document.createElement('span')
  a.style.color = 'red'
  return a
}

export const wrapperBlockColorCreateDOM: CreateDOMFunction = ({ editorConfig, editor, node }) => {
  const a = document.createElement('span')
  a.style.color = node.getFields().color
  return a
}
