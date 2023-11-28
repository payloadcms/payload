import React, { useMemo } from 'react'

import type { RichTextField } from '../../../../../fields/config/types'

const RichText: React.FC<RichTextField> = (props) => {
  const { editor } = props
  //const editor2: RichTextAdapter = lexicalEditor()

  const FieldComponent: React.FC<any> = useMemo(() => {
    return editor?.FieldComponent
      ? React.lazy(() => {
          return editor.FieldComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          }))
        })
      : null
  }, [editor])

  return (
    FieldComponent && (
      <React.Suspense>
        <p>hi</p>
        <FieldComponent {...props} />
      </React.Suspense>
    )
  )
}

export default RichText
