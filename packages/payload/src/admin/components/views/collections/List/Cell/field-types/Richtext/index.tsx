import React, { useMemo } from 'react'

import type { RichTextField } from '../../../../../../../../fields/config/types'
import type { RichTextAdapter } from '../../../../../../forms/field-types/RichText/types'
import type { CellComponentProps } from '../../types'

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
