import type { Block, Data, Field, Fields } from 'payload/types'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import isDeepEqual from 'deep-equal'
import { $getNodeByKey } from 'lexical'
import { Button, ErrorPill, Pill } from 'payload/components'
import { Collapsible } from 'payload/components/elements'
import { SectionTitle } from 'payload/components/fields/Blocks'
import { RenderFields, createNestedFieldPath, useFormSubmitted } from 'payload/components/forms'
import { useDocumentInfo } from 'payload/components/utilities'
import { getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { FieldProps } from '../../../../types'
import type { BlockFields, BlockNode } from '../nodes/BlocksNode'

import { FormSavePlugin } from './FormSavePlugin'

type Props = {
  baseClass: string
  block: Block
  blockFieldWrapperName: string
  field: FieldProps
  formData: BlockFields
  formSchema: Field[]
  nodeKey: string
}

/**
 * The actual content of the Block. This should be INSIDE a Form component,
 * scoped to the block. All format operations in here are thus scoped to the block's form, and
 * not the whole document.
 */
export const BlockContent: React.FC<Props> = (props) => {
  const {
    baseClass,
    block: { labels },
    blockFieldWrapperName,
    field,
    formData,
    formSchema,
    nodeKey,
  } = props
  const { i18n } = useTranslation()
  const [editor] = useLexicalComposerContext()
  // Used for saving collapsed to preferences (and gettin' it from there again)
  // Remember, these preferences are scoped to the whole document, not just this form. This
  // is important to consider for the data path used in setDocFieldPreferences
  const { getDocPreferences, setDocFieldPreferences } = useDocumentInfo()

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    let initialState = false

    getDocPreferences().then((currentDocPreferences) => {
      const currentFieldPreferences = currentDocPreferences?.fields[field.name]

      const collapsedMap: { [key: string]: boolean } = currentFieldPreferences?.collapsed

      if (collapsedMap && collapsedMap[formData.id] !== undefined) {
        setCollapsed(collapsedMap[formData.id])
        initialState = collapsedMap[formData.id]
      }
    })
    return initialState
  })
  const hasSubmitted = useFormSubmitted()

  const [errorCount, setErrorCount] = React.useState(0)

  const fieldHasErrors = hasSubmitted && errorCount > 0

  const classNames = [
    `${baseClass}__row`,
    fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ]
    .filter(Boolean)
    .join(' ')

  const path = '' as const

  const onFormChange = useCallback(
    ({
      fullFieldsWithValues,
      newFormData,
    }: {
      fullFieldsWithValues: Fields
      newFormData: Data
    }) => {
      // Recursively remove all undefined values from even being present in formData, as they will
      // cause isDeepEqual to return false if, for example, formData has a key that fields.data
      // does not have, even if it's undefined.
      // Currently, this happens if a block has another sub-blocks field. Inside of formData, that sub-blocks field has an undefined blockName property.
      // Inside of fields.data however, that sub-blocks blockName property does not exist at all.
      function removeUndefinedRecursively(obj: object) {
        Object.keys(obj).forEach((key) => {
          if (obj[key] && typeof obj[key] === 'object') {
            removeUndefinedRecursively(obj[key])
          } else if (obj[key] === undefined) {
            delete obj[key]
          }
        })
      }
      removeUndefinedRecursively(newFormData)
      removeUndefinedRecursively(formData)

      // Only update if the data has actually changed. Otherwise, we may be triggering an unnecessary value change,
      // which would trigger the "Leave without saving" dialog unnecessarily
      if (!isDeepEqual(formData, newFormData)) {
        editor.update(() => {
          const node: BlockNode = $getNodeByKey(nodeKey)

          if (node) {
            node.setFields(newFormData as BlockFields)
          }
        })
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
    [editor, nodeKey, hasSubmitted, blockFieldWrapperName, formData],
  )

  const onCollapsedChange = useCallback(() => {
    getDocPreferences().then((currentDocPreferences) => {
      const currentFieldPreferences = currentDocPreferences?.fields[field.name]

      const collapsedMap: { [key: string]: boolean } = currentFieldPreferences?.collapsed

      const newCollapsed: { [key: string]: boolean } =
        collapsedMap && collapsedMap?.size ? collapsedMap : {}

      newCollapsed[formData.id] = !collapsed

      setDocFieldPreferences(field.name, {
        collapsed: newCollapsed,
      })
    })
  }, [collapsed, getDocPreferences, field.name, setDocFieldPreferences, formData.id])

  const removeBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

  const fieldSchemaWithPath = formSchema.map((field) => ({
    ...field,
    path: createNestedFieldPath(null, field),
  }))

  return (
    <React.Fragment>
      <Collapsible
        className={classNames}
        collapsed={collapsed}
        collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
        header={
          <div className={`${baseClass}__block-header`}>
            <div>
              <Pill
                className={`${baseClass}__block-pill ${baseClass}__block-pill-${formData?.blockType}`}
                pillStyle="white"
              >
                {getTranslation(labels.singular, i18n)}
              </Pill>
              <SectionTitle path={`${path}blockName`} readOnly={field?.admin?.readOnly} />
              {fieldHasErrors && <ErrorPill count={errorCount} withMessage />}
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
        }
        key={0}
        onToggle={(collapsed) => {
          setCollapsed(collapsed)
          onCollapsedChange()
        }}
      >
        <RenderFields
          className={`${baseClass}__fields`}
          fieldSchema={fieldSchemaWithPath}
          fieldTypes={field.fieldTypes}
          forceRender
          margins="small"
          permissions={field.permissions?.blocks?.[formData?.blockType]?.fields}
          readOnly={field.admin.readOnly}
        />
      </Collapsible>

      <FormSavePlugin onChange={onFormChange} />
    </React.Fragment>
  )
}
