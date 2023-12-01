import React, { useMemo } from 'react'

import type { RichTextField } from '../../../../../../../../fields/config/types'
import type { RichTextAdapter } from '../../../../../../forms/field-types/RichText/types'
import type { CellComponentProps } from '../../types'

const RichTextCell: React.FC<CellComponentProps<RichTextField>> = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.field.editor
  const { CellComponent } = editor

  const isAsync = typeof CellComponent === 'object' && CellComponent?.AsyncComponent

  const ImportedCellComponent: React.FC<any> = useMemo(() => {
    return isAsync
      ? React.lazy(() => {
          return CellComponent.AsyncComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          }))
        })
      : null
  }, [CellComponent, isAsync])

  if (isAsync) {
    return (
      ImportedCellComponent && (
        <React.Suspense>
          <ImportedCellComponent {...props} />
        </React.Suspense>
      )
    )
  }

  // @ts-ignore
  return <CellComponent {...fieldprops} />
}

export default RichTextCell
