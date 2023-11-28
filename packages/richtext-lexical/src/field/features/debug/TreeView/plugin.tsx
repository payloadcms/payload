'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TreeView } from '@lexical/react/LexicalTreeView'
import * as React from 'react'

import './index.scss'

export function TreeViewPlugin(): JSX.Element {
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
