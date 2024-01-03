'use client'
import React from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

export const DiffViewer: React.FC<{
  comparisonToRender: string
  diffMethod: string
  placeholder: string
  versionToRender: string
  diffStyles: any
}> = ({ comparisonToRender, diffMethod, placeholder, versionToRender, diffStyles }) => {
  return (
    <ReactDiffViewer
      compareMethod={DiffMethod[diffMethod]}
      hideLineNumbers
      newValue={typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder}
      oldValue={
        typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder
      }
      showDiffOnly={false}
      splitView
      styles={diffStyles}
    />
  )
}
