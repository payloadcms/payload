'use client'
import type {
  SerializedListItemNode as _SerializedListItemNode,
  SerializedListNode as _SerializedListNode,
} from '@lexical/list'
import type { SerializedLexicalNode } from 'lexical'

import { ListPlugin } from '@lexical/react/LexicalListPlugin.js'
import React from 'react'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'
import type { PluginComponent } from '../../typesClient.js'

export type SerializedListItemNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedListItemNode, 'listitem', T> & {
    checked?: boolean
  }

export type SerializedListNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedListNode, 'list', T> & {
    checked?: boolean
  }

export const LexicalListPlugin: PluginComponent<undefined> = () => {
  return <ListPlugin />
}
