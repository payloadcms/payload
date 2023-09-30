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

  const path = `${field.path}.${0}`

  const block = (
    editorConfig?.resolvedFeatureMap?.get('blocks')?.props as BlocksFeatureProps
  )?.blocks?.find((block) => block.slug === fields?.type)

  const onFormChange = useCallback(
    ({ formData }: { formData: Data }) => {
      console.log('processing', formData)
      editor.update(() => {
        const node: BlockNode = $getNodeByKey(nodeKey)
        if (node) {
          node.setFields({
            data: formData,
            type: block.slug,
          })

          /*
          node.replace(
            $createBlockNode({
              data: formData,
              type: block.slug,
            }),
          )
          */
        }
      })
    },
    [block?.slug, editor, nodeKey],
  )

  const initialDataRef = React.useRef<Data>(buildInitialState(fields.data || {})) // Store initial value in a ref, so it doesn't change on re-render and only gets initialized once

  // Memoized Form JSX
  const formContent = useMemo(() => {
    return (
      block && (
        <Form initialState={initialDataRef?.current}>
          <div id={`row-${0}`} key={`$row-${0}`}>
            <Collapsible
              className=""
              collapsed={false}
              collapsibleStyle={false ? 'error' : 'default'}
              header={
                <div className={`${baseClass}__block-header`}>
                  <span className={`${baseClass}__block-number`}>
                    {String(0 + 1).padStart(2, '0')}
                  </span>
                  <Pill
                    className={`${baseClass}__block-pill ${baseClass}__block-pill-${fields.type}`}
                    pillStyle="white"
                  >
                    {getTranslation(block.labels.singular, i18n)}
                  </Pill>
                  <SectionTitle path={`${path}.blockName`} readOnly={field?.admin?.readOnly} />
                  {false && <ErrorPill count={0} withMessage />}
                </div>
              }
              key={0}
              onToggle={(collapsed) => {}}
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

          <FormSavePlugin onChange={onFormChange} />
        </Form>
      )
    )
  }, [block, onFormChange, field.fieldTypes, field.admin.readOnly])

  return <div className="className">{formContent}</div>
}
