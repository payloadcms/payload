'use client'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin.js'
import React from 'react'

import type { PluginComponent } from '../../../../typesClient.js'

export const LexicalCheckListPlugin: PluginComponent<undefined> = () => {
  return <CheckListPlugin />
}
