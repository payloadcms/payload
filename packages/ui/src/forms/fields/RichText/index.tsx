import React, { useMemo } from 'react'

import type { RichTextAdapter } from 'payload/types'
import { Props } from './types'

const RichText: React.FC<Props> = (props) => {
  console.log(props)
  return null
  // // eslint-disable-next-line react/destructuring-assignment
  // const editor: RichTextAdapter = fieldprops.editor

  // const isLazy = 'LazyFieldComponent' in editor

  // const ImportedFieldComponent: React.FC<any> = useMemo(() => {
  //   return isLazy
  //     ? React.lazy(() => {
  //         return editor.LazyFieldComponent().then((resolvedComponent) => ({
  //           default: resolvedComponent,
  //         }))
  //       })
  //     : null
  // }, [editor, isLazy])

  // if (isLazy) {
  //   return (
  //     ImportedFieldComponent && (
  //       <React.Suspense>
  //         <ImportedFieldComponent {...fieldprops} />
  //       </React.Suspense>
  //     )
  //   )
  // }

  // return <editor.FieldComponent {...fieldprops} />
}

export default RichText
