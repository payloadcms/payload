'use client'
import React from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

export const DiffViewer: React.FC<{
  diffMethod: string
  diffStyles: any
  placeholder: string
  renderedValueFrom: string
  renderedValueTo: string
}> = ({ diffMethod, diffStyles, placeholder, renderedValueFrom, renderedValueTo }) => {
  return (
    <ReactDiffViewer
      compareMethod={DiffMethod[diffMethod]}
      hideLineNumbers
      newValue={typeof renderedValueTo !== 'undefined' ? renderedValueTo : placeholder}
      oldValue={renderedValueFrom}
      showDiffOnly={false}
      splitView
      styles={diffStyles}
    />
  )
}
