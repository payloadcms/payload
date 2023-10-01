import { $getNodeByKey, type ElementFormatType } from 'lexical'
import { Collapsible } from 'payload/components/elements'
import {
  Form,
  HiddenInput,
  RenderFields,
  buildInitialState,
  createNestedFieldPath,
} from 'payload/components/forms'
import React, { useCallback, useMemo } from 'react'

import type { BlockNode } from '../nodes/BlocksNode'

import { $createBlockNode, type BlockFields } from '../nodes/BlocksNode'
const baseClass = 'lexical-block'

import type { Data } from 'payload/types'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ErrorPill, Pill } from 'payload/components'
import { RowActions, SectionTitle } from 'payload/components/fields/Blocks'
import { getTranslation } from 'payload/utilities'
import { useTranslation } from 'react-i18next'

import type { BlocksFeatureProps } from '..'

import { useEditorConfigContext } from '../../../lexical/config/EditorConfigProvider'
import { FormSavePlugin } from './FormSavePlugin'
import './index.scss'

type Props = {
  children?: React.ReactNode
  className?: string
  fields: BlockFields
  format?: ElementFormatType
  nodeKey?: string
}

export const BlockComponent: React.FC<Props> = (props) => {
  const { children, className, fields, format, nodeKey } = props
  const [editor] = useLexicalComposerContext()
  const { editorConfig, field } = useEditorConfigContext()
  const { i18n } = useTranslation()
  const [collapsed, setCollapsed] = React.useState<boolean>(fields.collapsed)
  const [blockName, setBlockName] = React.useState<string>(fields.blockName)

  const path = `${field.path}.${0}`

  const block = (
    editorConfig?.resolvedFeatureMap?.get('blocks')?.props as BlocksFeatureProps
  )?.blocks?.find((block) => block.slug === fields?.type)

  const onFormChange = useCallback(
    ({ formData }: { formData: Data }) => {
      editor.update(() => {
        const node: BlockNode = $getNodeByKey(nodeKey)
        if (node) {
          console.log(
            'onFormChange',
            formData,
            'schema',
            block.fields.map((field) => ({
              ...field,
              path: createNestedFieldPath(null, field),
            })),
          )
          node.setFields({
            blockName: blockName,
            collapsed: collapsed,
            data: formData,
            type: block.slug,
          })
        }
      })
    },
    [block?.slug, editor, nodeKey, collapsed, blockName],
  )

  const onCollapsedOrBlockNameChange = useCallback(() => {
    editor.update(() => {
      const node: BlockNode = $getNodeByKey(nodeKey)
      if (node) {
        node.setFields({
          ...node.getFields(),
          blockName: blockName,
          collapsed: collapsed,
        })
      }
    })
  }, [editor, nodeKey, collapsed, blockName])

  const initialDataRef = React.useRef<Data>(buildInitialState(fields.data || {})) // Store initial value in a ref, so it doesn't change on re-render and only gets initialized once

  // Memoized Form JSX
  const formContent = useMemo(() => {
    return (
      block && (
        <Form initialState={initialDataRef?.current}>
          <div id={`row-${0}`} key={`$row-${0}`}>
            <Collapsible
              className=""
              collapsed={collapsed}
              collapsibleStyle={false ? 'error' : 'default'}
              header={
                <div className={`${baseClass}__block-header`}>
                  <Pill
                    className={`${baseClass}__block-pill ${baseClass}__block-pill-${fields.type}`}
                    pillStyle="white"
                  >
                    {getTranslation(block.labels.singular, i18n)}
                  </Pill>
                  <SectionTitle
                    customOnChange={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setBlockName(e.target.value)
                      onCollapsedOrBlockNameChange()
                    }}
                    customValue={blockName}
                    path={`${path}.blockName`}
                    readOnly={field?.admin?.readOnly}
                  />
                  {false && <ErrorPill count={0} withMessage />}
                </div>
              }
              key={0}
              onToggle={(collapsed) => {
                setCollapsed(collapsed)
                onCollapsedOrBlockNameChange()
              }}
            >
              <HiddenInput name={`${path}.id`} value={0} />

              <RenderFields
                className={`${baseClass}__fields`}
                fieldSchema={block.fields.map((field) => ({
                  ...field,
                  path: createNestedFieldPath(null, field),
                }))}
                fieldTypes={field.fieldTypes}
                margins="small"
                permissions={field.permissions?.blocks?.[fields?.type]?.fields}
                readOnly={field.admin.readOnly}
              />
            </Collapsible>
          </div>

          <FormSavePlugin
            fieldSchema={block.fields.map((field) => ({
              ...field,
              path: createNestedFieldPath(null, field),
            }))}
            onChange={onFormChange}
          />
        </Form>
      )
    )
  }, [block, onFormChange, field.fieldTypes, field.admin.readOnly])

  return <div className={baseClass}>{formContent}</div>
}
