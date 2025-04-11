'use client'

import type { LexicalEditor, LexicalNode, NodeKey } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createNodeSelection, $getRoot, $isElementNode, $setSelection } from 'lexical'
import React, { useEffect, useRef, useState } from 'react'

export function getNodeKeyFromDOMNode(dom: Node, editor: LexicalEditor): NodeKey | undefined {
  const prop = `__lexicalKey_${editor._key}`
  return (dom as Node & Record<typeof prop, NodeKey | undefined>)[prop]
}

type Props = {
  editorContainerRef: React.RefObject<HTMLDivElement | null>
}

export function RectangleSelectionPlugin({ editorContainerRef }: Props) {
  const [editor] = useLexicalComposerContext()
  const selectionRectangleRef = useRef<HTMLDivElement>(null)
  const [previouslySelectedNodes, setPreviouslySelectedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    const selectionRect = selectionRectangleRef.current
    let isDragging = false
    let startX: number
    let startY: number

    if (!editorContainerRef.current || !selectionRect) {
      return
    }

    const onMouseDown = (e: MouseEvent) => {
      if (!editorContainerRef.current) {
        return
      }
      // Ensure the click is within the editor container
      if (!e.target || !editorContainerRef.current.contains(e.target as Node)) {
        return
      }

      isDragging = true
      const rect = editorContainerRef.current.getBoundingClientRect()
      startX = e.clientX - rect.left
      startY = e.clientY - rect.top

      selectionRect.style.left = `${startX}px`
      selectionRect.style.top = `${startY}px`
      selectionRect.style.width = '0px'
      selectionRect.style.height = '0px'
      selectionRect.style.display = 'block'
    }

    const $onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !editorContainerRef.current) {
        return
      }

      const rect = editorContainerRef.current.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top

      const rectX = Math.min(startX, currentX)
      const rectY = Math.min(startY, currentY)
      const rectWidth = Math.abs(currentX - startX)
      const rectHeight = Math.abs(currentY - startY)

      selectionRect.style.left = `${rectX}px`
      selectionRect.style.top = `${rectY}px`
      selectionRect.style.width = `${rectWidth}px`
      selectionRect.style.height = `${rectHeight}px`

      // Use the rectangle dimensions to detect intersecting nodes
      const selectionBox = new DOMRect(rectX, rectY, rectWidth, rectHeight)
      const currentSelectedNodes = getNodesInRectangle(selectionBox, editor)

      // Compare with previously selected nodes
      const currentSelectedNodeKeys = new Set(currentSelectedNodes.map((node) => node.getKey()))
      if (!areSetsEqual(previouslySelectedNodes, currentSelectedNodeKeys)) {
        setPreviouslySelectedNodes(currentSelectedNodeKeys)
        selectNodes(editor, currentSelectedNodes)
      }
    }

    const onMouseUp = () => {
      if (!isDragging) {
        return
      }

      isDragging = false
      // Select the nodes
      const nodes = getNodesInRectangle(
        new DOMRect(
          parseInt(selectionRect.style.left),
          parseInt(selectionRect.style.top),
          parseInt(selectionRect.style.width),
          parseInt(selectionRect.style.height),
        ),
        editor,
      )
      selectNodes(editor, nodes)

      selectionRect.style.display = 'none'
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', $onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', $onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [editor, editorContainerRef])

  return (
    <div
      id="selection-rectangle"
      ref={selectionRectangleRef}
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid white',
        display: 'none',
        position: 'absolute',
      }}
    />
  )
}

function getNodesInRectangle(rect: DOMRect, editor: LexicalEditor): LexicalNode[] {
  const nodes: LexicalNode[] = []
  editor.getEditorState().read(() => {
    const root = $getRoot()
    for (const node of root.getChildren()) {
      const domElement = editor.getElementByKey(node.getKey())
      if (domElement) {
        const domRect = domElement.getBoundingClientRect()
        if (rectIntersects(rect, domRect)) {
          nodes.push(node)
        }
      }
    }
  })
  return nodes
}

function rectIntersects(rect1: DOMRect, rect2: DOMRect): boolean {
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  )
}

function selectNodes(editor: LexicalEditor, nodes: LexicalNode[]) {
  editor.update(() => {
    const selection = $createNodeSelection()

    for (const node of nodes) {
      selection.add(node.getKey())
      // Select all children
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          selection.add(child.getKey())
        }
      }
    }
    $setSelection(selection)
  })
}

function areSetsEqual(setA: Set<string>, setB: Set<string>): boolean {
  if (setA.size !== setB.size) {
    return false
  }
  for (const a of setA) {
    if (!setB.has(a)) {
      return false
    }
  }
  return true
}
