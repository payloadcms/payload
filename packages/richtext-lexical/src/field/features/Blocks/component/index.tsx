import { type ElementFormatType } from 'lexical'
import { Form, buildInitialState } from 'payload/components/forms'
import React, { useMemo } from 'react'

import { type BlockFields } from '../nodes/BlocksNode'
const baseClass = 'lexical-block'

import type { Data } from 'payload/types'

import { useConfig } from 'payload/components/utilities'
import { sanitizeFields } from 'payload/config'

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

  const initialDataRef = React.useRef<Data>(buildInitialState(fields.data || {})) // Store initial value in a ref, so it doesn't change on re-render and only gets initialized once

  // Memoized Form JSX
  const formContent = useMemo(() => {
    return (
      block && (
        <Form initialState={initialDataRef?.current}>
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
  }, [block, field, nodeKey])

  return <div className={baseClass}>{formContent}</div>
}
