'use client'
import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin.js'
import React from 'react'

export function ClickableLinkPlugin() {
  const Component = LexicalClickableLinkPlugin.default || LexicalClickableLinkPlugin
  //@ts-expect-error ts being dumb
  return <Component />
}
