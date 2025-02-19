'use client'

import React from 'react'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { MoveDocToFolder } from '../MoveDocToFolder/index.js'

export function SetDocumentFolder() {
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const currentParentFolder = useFormFields(([fields]) => (fields && fields?._parentFolder) || null)
  const { setModified } = useForm()

  return (
    <MoveDocToFolder
      onConfirm={(newFolderID) => {
        if (currentParentFolder !== newFolderID) {
          dispatchField({
            type: 'UPDATE',
            path: '_parentFolder',
            value: newFolderID,
          })
          setModified(true)
        }
      }}
    />
  )
}
