'use client'
import { ListPlugin } from '@lexical/react/LexicalListPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../types.js'

export const LexicalListPlugin: PluginComponent<undefined> = () => {
  return <ListPlugin />
}
