'use client'
import lexicalComposerContextImport from '@lexical/react/LexicalComposerContext.js'
const { useLexicalComposerContext } = lexicalComposerContextImport
import lexicalTreeViewImport from '@lexical/react/LexicalTreeView.js'
const { TreeView } = lexicalTreeViewImport
import * as React from 'react'

import './index.scss'

export function TreeViewPlugin(): React.ReactNode {
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
