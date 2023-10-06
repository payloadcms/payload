import type { Block, Data, Fields } from 'payload/types'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { Button, ErrorPill, Pill } from 'payload/components'
import { Collapsible } from 'payload/components/elements'
import { SectionTitle } from 'payload/components/fields/Blocks'
import { RenderFields, createNestedFieldPath, useFormSubmitted } from 'payload/components/forms'
import { getTranslation } from 'payload/utilities'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { FieldProps } from '../../../../types'
import type { BlockFields, BlockNode } from '../nodes/BlocksNode'

import { FormSavePlugin } from './FormSavePlugin'

type Props = {
  baseClass: string
  block: Block
  field: FieldProps
  fields: BlockFields
  nodeKey: string
}

export const BlockContent: React.FC<Props> = (props) => {
  const { baseClass, block, field, fields, nodeKey } = props
  const { i18n } = useTranslation()
  const [editor] = useLexicalComposerContext()
  const [collapsed, setCollapsed] = React.useState<boolean>(fields.collapsed)
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
    ({ fields: formFields, formData }: { fields: Fields; formData: Data }) => {
      editor.update(() => {
        const node: BlockNode = $getNodeByKey(nodeKey)
        if (node) {
          node.setFields({
            collapsed: collapsed,
            data: formData as any,
          })
        }
      })

      // update error count
      if (hasSubmitted) {
        let rowErrorCount = 0
        for (const formField of Object.values(formFields)) {
          if (formField?.valid === false) {
            rowErrorCount++
          }
        }
        setErrorCount(rowErrorCount)
      }
    },
    [editor, nodeKey, collapsed, hasSubmitted],
  )

  const onCollapsedChange = useCallback(() => {
    editor.update(() => {
      const node: BlockNode = $getNodeByKey(nodeKey)
      if (node) {
        node.setFields({
          ...node.getFields(),
          collapsed: collapsed,
        })
      }
    })
  }, [editor, nodeKey, collapsed])

  const removeBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

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
                className={`${baseClass}__block-pill ${baseClass}__block-pill-${fields?.data?.blockType}`}
                pillStyle="white"
              >
                {getTranslation(block.labels.singular, i18n)}
              </Pill>
              <SectionTitle path={`${path}blockName`} readOnly={field?.admin?.readOnly} />
              {fieldHasErrors && <ErrorPill count={errorCount} withMessage />}
            </div>
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
          fieldSchema={block.fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(null, field),
          }))}
          fieldTypes={field.fieldTypes}
          margins="small"
          permissions={field.permissions?.blocks?.[fields?.data?.blockType]?.fields}
          readOnly={field.admin.readOnly}
        />
      </Collapsible>

      <FormSavePlugin
        fieldSchema={block.fields.map((field) => ({
          ...field,
          path: createNestedFieldPath(null, field),
        }))}
        onChange={onFormChange}
      />
    </React.Fragment>
  )
}
