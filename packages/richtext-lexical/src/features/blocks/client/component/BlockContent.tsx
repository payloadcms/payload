'use client'
import type { ClientBlock, ClientField, CollapsedPreferences, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  Collapsible,
  ErrorPill,
  Pill,
  RenderComponent,
  RenderFields,
  SectionTitle,
  useDocumentInfo,
  useFormSubmitted,
  useTranslation,
} from '@payloadcms/ui'
import { dequal } from 'dequal/lite'
import { $getNodeByKey } from 'lexical'
import React, { useCallback, useEffect } from 'react'

import type { LexicalRichTextFieldProps } from '../../../../types.js'
import type { BlockFields } from '../../server/nodes/BlocksNode.js'

import { $isBlockNode } from '../nodes/BlocksNode.js'
import { FormSavePlugin } from './FormSavePlugin.js'

type Props = {
  baseClass: string
  clientBlock: ClientBlock
  field: LexicalRichTextFieldProps['field']
  formData: BlockFields
  formSchema: ClientField[]
  nodeKey: string
  path: string
  schemaPath: string
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

/**
 * The actual content of the Block. This should be INSIDE a Form component,
 * scoped to the block. All format operations in here are thus scoped to the block's form, and
 * not the whole document.
 */
export const BlockContent: React.FC<Props> = (props) => {
  const { baseClass, clientBlock, field, formSchema, nodeKey, schemaPath } = props
  let { formData } = props

  const { i18n } = useTranslation()
  const [editor] = useLexicalComposerContext()
  // Used for saving collapsed to preferences (and gettin' it from there again)
  // Remember, these preferences are scoped to the whole document, not just this form. This
  // is important to consider for the data path used in setDocFieldPreferences
  const { getDocPreferences, setDocFieldPreferences } = useDocumentInfo()

  const [isCollapsed, setIsCollapsed] = React.useState<boolean>()

  useEffect(() => {
    void getDocPreferences().then((currentDocPreferences) => {
      const currentFieldPreferences = currentDocPreferences?.fields[field.name]
      const collapsedArray = currentFieldPreferences?.collapsed
      setIsCollapsed(collapsedArray && collapsedArray.includes(formData.id))
    })
  }, [field.name, formData.id, getDocPreferences])

  const hasSubmitted = useFormSubmitted()

  const [errorCount, setErrorCount] = React.useState(0)

  const fieldHasErrors = hasSubmitted && errorCount > 0

  const classNames = [
    `${baseClass}__row`,
    fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ]
    .filter(Boolean)
    .join(' ')

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
              formData = newFormData
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

  const onCollapsedChange = useCallback(
    (changedCollapsed: boolean) => {
      void getDocPreferences().then((currentDocPreferences) => {
        const currentFieldPreferences = currentDocPreferences?.fields[field.name]

        const collapsedArray = currentFieldPreferences?.collapsed

        const newCollapsed: CollapsedPreferences =
          collapsedArray && collapsedArray?.length ? collapsedArray : []

        if (changedCollapsed) {
          if (!newCollapsed.includes(formData.id)) {
            newCollapsed.push(formData.id)
          }
        } else {
          if (newCollapsed.includes(formData.id)) {
            newCollapsed.splice(newCollapsed.indexOf(formData.id), 1)
          }
        }

        setDocFieldPreferences(field.name, {
          collapsed: newCollapsed,
          hello: 'hi',
        })
      })
    },
    [getDocPreferences, field.name, setDocFieldPreferences, formData.id],
  )

  const removeBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  }, [editor, nodeKey])

  if (typeof isCollapsed !== 'boolean') return null

  return (
    <React.Fragment>
      <Collapsible
        className={classNames}
        collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
        header={
          clientBlock?.admin?.components?.Label ? (
            <RenderComponent
              clientProps={{ blockKind: 'lexicalBlock', formData }}
              mappedComponent={clientBlock.admin.components.Label}
            />
          ) : (
            <div className={`${baseClass}__block-header`}>
              <div>
                <Pill
                  className={`${baseClass}__block-pill ${baseClass}__block-pill-${formData?.blockType}`}
                  pillStyle="white"
                >
                  {typeof clientBlock?.labels?.singular === 'string'
                    ? getTranslation(clientBlock?.labels.singular, i18n)
                    : clientBlock.slug}
                </Pill>
                <SectionTitle path="blockName" readOnly={field?.admin?.readOnly || false} />
                {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
              </div>
              {editor.isEditable() && (
                <Button
                  buttonStyle="icon-label"
                  className={`${baseClass}__removeButton`}
                  disabled={field?.admin?.readOnly}
                  icon="x"
                  onClick={(e) => {
                    e.preventDefault()
                    removeBlock()
                  }}
                  round
                  tooltip="Remove Block"
                />
              )}
            </div>
          )
        }
        isCollapsed={isCollapsed}
        key={0}
        onToggle={(incomingCollapsedState) => {
          onCollapsedChange(incomingCollapsedState)
          setIsCollapsed(incomingCollapsedState)
        }}
      >
        <RenderFields
          className={`${baseClass}__fields`}
          fields={formSchema}
          forceRender
          margins="small"
          path="" // Leaving path empty makes it so field values are not prefixed / scoped by the entire schemaPath. e.g. we can access "myField" instead of "someLexicalField.feature.blocks.someArrayB" // TODO: Could there be any implications leaving path different than schemaPath?
          readOnly={false}
          schemaPath={schemaPath} // Having the correct schemaPath here allows sub-fields (like array > addRow) to run correct form-state calls and retrieve their needed form state from the server
        />
      </Collapsible>

      <FormSavePlugin onChange={onFormChange} />
    </React.Fragment>
  )
}
