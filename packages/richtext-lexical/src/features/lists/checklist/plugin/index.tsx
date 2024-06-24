'use client'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../../types.js'

export const LexicalCheckListPlugin: PluginComponent<undefined> = () => {
  return <CheckListPlugin />
}
