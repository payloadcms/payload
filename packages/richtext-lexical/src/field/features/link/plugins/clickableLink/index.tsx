'use client'
import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../../types.js'
import type { ClientProps } from '../../feature.client.js'

export const ClickableLinkPlugin: PluginComponent<ClientProps> = () => {
  const Component = LexicalClickableLinkPlugin.default || LexicalClickableLinkPlugin
  //@ts-expect-error ts being dumb
  return <Component />
}
