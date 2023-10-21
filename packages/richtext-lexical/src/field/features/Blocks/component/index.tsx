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

export const BlockComponent: React.FC<Props> = (props) => {
  const { children, className, fields, format, nodeKey } = props
  const payloadConfig = useConfig()
  const submitted = useFormSubmitted()

  const { editorConfig, field } = useEditorConfigContext()

  const block = (
    editorConfig?.resolvedFeatureMap?.get('blocks')?.props as BlocksFeatureProps
  )?.blocks?.find((block) => block.slug === fields?.data?.blockType)

  // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
  const validRelationships = payloadConfig.collections.map((c) => c.slug) || []
  block.fields = sanitizeFields({
    config: payloadConfig,
    fields: block.fields,
    validRelationships,
  })

  const initialStateRef = React.useRef<Data>(buildInitialState(fields.data || {})) // Store initial value in a ref, so it doesn't change on re-render and only gets initialized once

  const config = useConfig()
  const { t } = useTranslation('general')
  const { code: locale } = useLocale()
  const { getDocPreferences } = useDocumentInfo()

  // initialState State

  const [initialState, setInitialState] = React.useState<Data>(null)

  useEffect(() => {
    async function buildInitialState() {
      const preferences = await getDocPreferences()

      const stateFromSchema = await buildStateFromSchema({
        config,
        data: fields.data,
        fieldSchema: block.fields,
        locale,
        operation: 'update',
        preferences,
        t,
      })

      // We have to merge the output of buildInitialState (above this useEffect) with the output of buildStateFromSchema.
      // That's because the output of buildInitialState provides important properties necessary for THIS block,
      // like blockName, blockType and id, while buildStateFromSchema provides the correct output of this block's data,
      // e.g. if this block has a sub-block (like the `rows` property)
      setInitialState({
        ...initialStateRef?.current,
        ...stateFromSchema,
      })
    }
    void buildInitialState()
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
