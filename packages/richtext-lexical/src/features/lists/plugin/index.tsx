'use client'
import type {
  SerializedListItemNode as _SerializedListItemNode,
  SerializedListNode as _SerializedListNode,
} from '@lexical/list'
import type { Spread } from 'lexical'

import { ListPlugin } from '@lexical/react/LexicalListPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../typesClient.js'

export type SerializedListItemNode = Spread<
  {
    checked?: boolean
    type: 'listitem'
  },
  _SerializedListItemNode
>

export type SerializedListNode = Spread<
  {
    checked?: boolean
    type: 'list'
  },
  _SerializedListNode
>

export const LexicalListPlugin: PluginComponent<undefined> = () => {
  return <ListPlugin />
}
