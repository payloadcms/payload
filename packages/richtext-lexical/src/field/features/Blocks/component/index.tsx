import type { ElementFormatType } from 'lexical'

import { RenderFields, createNestedFieldPath } from 'payload/components/forms'
import React from 'react'

import type { BlockFields } from '../nodes/BlocksNode'
const baseClass = 'lexical-block'

import type { BlocksFeatureProps } from '..'

import { useEditorConfigContext } from '../../../lexical/config/EditorConfigProvider'
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

  const { editorConfig, field } = useEditorConfigContext()

  const path = `${field.path}.${0}`

  const block = (
    editorConfig?.resolvedFeatureMap?.get('blocks')?.props as BlocksFeatureProps
  )?.blocks?.find((block) => block.slug === fields?.type)

  return (
    <div className="className">
      <p>Block ${fields.type}</p>
      {block && (
        <RenderFields
          className={`${baseClass}__fields`}
          fieldSchema={block.fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
          fieldTypes={field.fieldTypes}
          indexPath={field.indexPath}
          margins="small"
          permissions={field.permissions}
          readOnly={field.admin.readOnly}
        />
      )}
    </div>
  )
}
