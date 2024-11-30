'use client'

import type { CreateDOMFunction } from '@payloadcms/richtext-lexical'

export const wrapperBlockCreateDOM: CreateDOMFunction = ({ editorConfig, editor, node }) => {
  const span = document.createElement('span')
  span.style.color = 'red'
  return span
}

export const wrapperBlockColorCreateDOM: CreateDOMFunction = ({ editorConfig, editor, node }) => {
  const span = document.createElement('span')
  span.style.color = node.getFields().color
  return span
}
