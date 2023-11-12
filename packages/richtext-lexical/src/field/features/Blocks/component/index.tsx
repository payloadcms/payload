'use client'
import { type ElementFormatType } from 'lexical'
import { Form, buildInitialState, useFormSubmitted } from 'payload/components/forms'
import React, { useEffect, useMemo } from 'react'

import { type BlockFields } from '../nodes/BlocksNode'
const baseClass = 'lexical-block'

import type { Data } from 'payload/types'

import {
  buildStateFromSchema,
  useConfig,
  useDocumentInfo,
  useLocale,
} from 'payload/components/utilities'
import { sanitizeFields } from 'payload/config'
import { useTranslation } from 'react-i18next'

import type { BlocksFeatureProps } from '..'

import { useEditorConfigContext } from '../../../lexical/config/EditorConfigProvider'
import { BlockContent } from './BlockContent'
import './index.scss'

type Props = {
  children?: React.ReactNode
  className?: string
  fields: BlockFields
  format?: ElementFormatType
  nodeKey?: string
}

/**
 * Wraps the input fields.data in a blockFieldWrapperName, so that it can be read by the RenderFields component
 * which requires it to be wrapped in a group field
 */
function transformInputFieldsData(data: any, blockFieldWrapperName: string) {
  const fieldDataWithoutBlockFields = { ...data }
  delete fieldDataWithoutBlockFields['id']
  delete fieldDataWithoutBlockFields['blockName']
  delete fieldDataWithoutBlockFields['blockType']

  // Wrap all fields inside blockFieldWrapperName.
  // This is necessary, because blockFieldWrapperName is set as the 'base' path for all fields in the block (in the RenderFields component).
  // Thus, in order for the data to be read, it has to be wrapped in this blockFieldWrapperName, as it's expected to be there.

  // Why are we doing this? Because that way, all rendered fields of the blocks have different paths and names, and thus don't conflict with each other.
  // They have different paths and names, because they are wrapped in the blockFieldWrapperName, which has a name that is unique for each block.
  return {
    id: data.id,
    [blockFieldWrapperName]: fieldDataWithoutBlockFields,
    blockName: data.blockName,
    blockType: data.blockType,
  }
}

export const BlockComponent: React.FC<Props> = (props) => {
  const { fields, nodeKey } = props
  const payloadConfig = useConfig()
  const submitted = useFormSubmitted()

  const { editorConfig, field } = useEditorConfigContext()

  const block = (
    editorConfig?.resolvedFeatureMap?.get('blocks')?.props as BlocksFeatureProps
  )?.blocks?.find((block) => block.slug === fields?.data?.blockType)

  const blockFieldWrapperName = block.slug + '-' + fields.data.id

  // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
  const validRelationships = payloadConfig.collections.map((c) => c.slug) || []
  block.fields = sanitizeFields({
    config: payloadConfig,
    fields: block.fields,
    validRelationships,
  })

  const initialStateRef = React.useRef<Data>(null) // Store initial value in a ref, so it doesn't change on re-render and only gets initialized once

  const config = useConfig()
  const { t } = useTranslation('general')
  const { code: locale } = useLocale()
  const { getDocPreferences } = useDocumentInfo()

  // initialState State
  const [initialState, setInitialState] = React.useState<Data>(null)

  useEffect(() => {
    async function createInitialState() {
      const preferences = await getDocPreferences()

      fields.data = transformInputFieldsData(fields.data, blockFieldWrapperName)

      // Add a group in the field schema, which represents all values saved in the blockFieldWrapperName
      const wrappedFieldSchema = [
        ...block.fields.filter(
          (field) => 'name' in field && ['blockName', 'blockType', 'id'].includes(field.name),
        ),
        {
          name: blockFieldWrapperName,
          admin: {
            hideGutter: true,
          },
          fields: block.fields.filter(
            (field) => !('name' in field) || !['blockName', 'blockType', 'id'].includes(field.name),
          ),
          label: '',
          type: 'group',
        },
      ]

      const stateFromSchema = await buildStateFromSchema({
        config,
        data: fields.data,
        fieldSchema: wrappedFieldSchema as any,
        locale,
        operation: 'update',
        preferences,
        t,
      })

      if (!initialStateRef.current) {
        initialStateRef.current = buildInitialState(fields.data)
      }

      // We have to merge the output of buildInitialState (above this useEffect) with the output of buildStateFromSchema.
      // That's because the output of buildInitialState provides important properties necessary for THIS block,
      // like blockName, blockType and id, while buildStateFromSchema provides the correct output of this block's data,
      // e.g. if this block has a sub-block (like the `rows` property)
      setInitialState({
        ...initialStateRef?.current,
        ...stateFromSchema,
      })
    }
    void createInitialState()
  }, [setInitialState, config, block, locale, getDocPreferences, t]) // do not add fields here, it causes an endless loop

  // Memoized Form JSX
  const formContent = useMemo(() => {
    return (
      block &&
      initialState && (
        <Form fields={block.fields} initialState={initialState} submitted={submitted}>
          <BlockContent
            baseClass={baseClass}
            block={block}
            blockFieldWrapperName={blockFieldWrapperName}
            field={field}
            fields={fields}
            nodeKey={nodeKey}
          />
        </Form>
      )
    )
  }, [block, field, nodeKey, submitted, initialState])

  return <div className={baseClass}>{formContent}</div>
}
