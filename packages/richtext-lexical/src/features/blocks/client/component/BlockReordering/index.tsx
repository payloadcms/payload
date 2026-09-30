import type { LexicalEditor } from 'lexical'
import type { ReactNode } from 'react'

import { useId } from 'react'

import { useBlockReordering } from '../useBlockReordering.js'

export function BlockReordering({
  children,
  editor,
  nodeKey,
}: {
  children: (
    props: { reorderInstructionsID: string } & ReturnType<typeof useBlockReordering>,
  ) => ReactNode
  editor: LexicalEditor
  nodeKey: string
}) {
  const reorder = useBlockReordering({ editor, nodeKey })
  const reorderInstructionsID = useId()

  return children({ ...reorder, reorderInstructionsID })
}
