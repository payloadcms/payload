import React from 'react'

import type { RichTextField } from '../../../../../fields/config/types'
import type { RichTextAdapter } from './types'
const RichText: React.FC<RichTextField> = (fieldprops) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = fieldprops.editor
  const { FieldComponent } = editor

  const ImportedFieldComponent: React.FC<any> = useMemo(() => {
    return FieldComponent
      ? React.lazy(() => {
          return FieldComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          }))
        })
      : null
  }, [FieldComponent])

  return (
    ImportedFieldComponent && (
      <React.Suspense>
        <ImportedFieldComponent {...fieldprops} />
      </React.Suspense>
    )
  )
}

export default RichText
