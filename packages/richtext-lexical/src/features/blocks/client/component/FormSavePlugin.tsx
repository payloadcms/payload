'use client'
import type { FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useAllFormFields, useFormSubmitted } from '@payloadcms/ui'
import { dequal } from 'dequal/lite'
import { $getNodeByKey } from 'lexical'
import { reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect } from 'react'

import type { BlockFields } from '../../server/nodes/BlocksNode.js'

import { $isBlockNode } from '../nodes/BlocksNode.js'
import { removeEmptyArrayValues } from './removeEmptyArrayValues.js'

type Props = {
  disabled?: boolean
  formData: BlockFields
  nodeKey: string
}

// Recursively remove all undefined values from even being present in formData, as they will
// cause isDeepEqual to return false if, for example, formData has a key that fields.data
// does not have, even if it's undefined.
// Currently, this happens if a block has another sub-blocks field. Inside formData, that sub-blocks field has an undefined blockName property.
// Inside of fields.data however, that sub-blocks blockName property does not exist at all.
function removeUndefinedAndNullAndEmptyArraysRecursively(obj: object) {
  for (const key in obj) {
    const value = obj[key]
    if (Array.isArray(value) && !value?.length) {
      delete obj[key]
    } else if (value && typeof value === 'object') {
      removeUndefinedAndNullAndEmptyArraysRecursively(value)
    } else if (value === undefined || value === null) {
      delete obj[key]
    }
  }
}

export const useFormSave = (props: Props): { errorCount: number; fieldHasErrors: boolean } => {
  const { disabled, formData, nodeKey } = props

  const [_fields] = useAllFormFields()

  const fields = removeEmptyArrayValues({ fields: _fields })

  // Pass in fields, and indicate if you'd like to "unflatten" field data.
  // The result below will reflect the data stored in the form at the given time
  const newFormData = reduceFieldsToValues(fields, true)

  const [editor] = useLexicalComposerContext()

  const hasSubmitted = useFormSubmitted()

  const [errorCount, setErrorCount] = React.useState(0)

  const fieldHasErrors = hasSubmitted && errorCount > 0

  const onFormChange = useCallback(
    ({
      fullFieldsWithValues,
      newFormData,
    }: {
      fullFieldsWithValues: FormState
      newFormData: BlockFields
    }) => {
      newFormData.id = formData.id
      newFormData.blockType = formData.blockType

      removeUndefinedAndNullAndEmptyArraysRecursively(newFormData)
      removeUndefinedAndNullAndEmptyArraysRecursively(formData)

      // Only update if the data has actually changed. Otherwise, we may be triggering an unnecessary value change,
      // which would trigger the "Leave without saving" dialog unnecessarily
      if (!dequal(formData, newFormData)) {
        // Running this in the next tick in the meantime fixes this issue: https://github.com/payloadcms/payload/issues/4108
        // I don't know why. When this is called immediately, it might focus out of a nested lexical editor field if an update is made there.
        // My hypothesis is that the nested editor might not have fully finished its update cycle yet. By updating in the next tick, we
        // ensure that the nested editor has finished its update cycle before we update the block node.
        setTimeout(() => {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey)
            if (node && $isBlockNode(node)) {
              node.setFields(newFormData)
            }
          })
        }, 0)
      }

      // update error count
      if (hasSubmitted) {
        let rowErrorCount = 0
        for (const formField of Object.values(fullFieldsWithValues)) {
          if (formField?.valid === false) {
            rowErrorCount++
          }
        }
        setErrorCount(rowErrorCount)
      }
    },
    [editor, nodeKey, hasSubmitted, formData],
  )

  useEffect(() => {
    if (disabled) {
      return
    }
    onFormChange({ fullFieldsWithValues: fields, newFormData: newFormData as BlockFields })
  }, [newFormData, fields, onFormChange, disabled])

  return {
    errorCount,
    fieldHasErrors,
  }
}
