'use client'
import { ListPlugin } from '@lexical/react/LexicalListPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../typesClient.js'

// Re-export the runtime types from the colocated schema module so existing
// imports from this client entry keep working.
export type { SerializedListItemNode, SerializedListNode } from '../shared/schema.js'

export const LexicalListPlugin: PluginComponent<undefined> = () => {
  return <ListPlugin />
}
