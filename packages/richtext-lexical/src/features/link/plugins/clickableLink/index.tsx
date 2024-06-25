'use client'
import { ClickableLinkPlugin as LexicalClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { ClientProps } from '../../feature.client.js'

export const ClickableLinkPlugin: PluginComponent<ClientProps> = () => {
  return <LexicalClickableLinkPlugin />
}
