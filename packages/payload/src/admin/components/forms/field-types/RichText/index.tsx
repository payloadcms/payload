import React, { useMemo } from 'react'

import type { RichTextField } from '../../../../../fields/config/types'
import type { RichTextAdapter } from './types'
const RichText: React.FC<RichTextField> = (fieldprops) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = fieldprops.editor
  const { FieldComponent } = editor

  const isAsync = typeof FieldComponent === 'object' && FieldComponent?.AsyncComponent

  const ImportedFieldComponent: React.FC<any> = useMemo(() => {
    return isAsync
      ? React.lazy(() => {
          return FieldComponent.AsyncComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          }))
        })
      : null
  }, [FieldComponent, isAsync])

  if (isAsync) {
    return (
      ImportedFieldComponent && (
        <React.Suspense>
          <ImportedFieldComponent {...fieldprops} />
        </React.Suspense>
      )
    )
  }

  // @ts-ignore
  return <FieldComponent {...fieldprops} />
}

export default RichText
