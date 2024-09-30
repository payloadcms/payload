'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { TreeView } from '@lexical/react/LexicalTreeView.js'
import * as React from 'react'

import type { PluginComponent } from '../../../../typesClient.js'

import './index.scss'

export const TreeViewPlugin: PluginComponent<undefined> = () => {
  const [editor] = useLexicalComposerContext()
  return (
    <TreeView
      editor={editor}
      timeTravelButtonClassName="debug-timetravel-button"
      timeTravelPanelButtonClassName="debug-timetravel-panel-button"
      timeTravelPanelClassName="debug-timetravel-panel"
      timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
      treeTypeButtonClassName="debug-treetype-button"
      viewClassName="tree-view-output"
    />
  )
}
