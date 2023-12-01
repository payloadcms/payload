import React from 'react'

import type { RichTextField } from '../../../../../../../../fields/config/types'
import type { RichTextAdapter } from '../../../../../../forms/field-types/RichText/types'
import type { CellComponentProps } from '../../types'

const RichTextCell: React.FC<CellComponentProps<RichTextField>> = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.field.editor
  const { CellComponent } = editor

  const ImportedCellComponent: React.FC<any> = useMemo(() => {
    return CellComponent
      ? React.lazy(() => {
          return CellComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          }))
        })
      : null
  }, [CellComponent])

  return (
    ImportedCellComponent && (
      <React.Suspense>
        <ImportedCellComponent {...props} />
      </React.Suspense>
    )
  )
}

export default RichTextCell
