import React, { useMemo } from 'react'

import type { RichTextField, RichTextAdapter, CellComponentProps } from 'payload/types'

const RichTextCell: React.FC<CellComponentProps<RichTextField>> = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.field.editor

  const isLazy = 'LazyCellComponent' in editor

  const ImportedCellComponent: React.FC<any> = useMemo(() => {
    return isLazy
      ? React.lazy(() => {
          return editor.LazyCellComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          }))
        })
      : null
  }, [editor, isLazy])

  if (isLazy) {
    return (
      ImportedCellComponent && (
        <React.Suspense>
          <ImportedCellComponent {...props} />
        </React.Suspense>
      )
    )
  }

  return <editor.CellComponent {...props} />
}

export default RichTextCell
