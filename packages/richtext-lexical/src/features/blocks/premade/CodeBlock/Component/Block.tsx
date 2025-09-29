'use client'
import type { UIFieldClientComponent } from 'payload'

import { RenderFields } from '@payloadcms/ui'
import React from 'react'

import { CodeBlockIcon } from '../../../../../lexical/ui/icons/CodeBlock/index.js'
import './index.scss'
import { useBlockComponentContext } from '../../../client/component/BlockContent.js'

const baseClass = 'payload-richtext-code-block'
export const CodeBlockBlockComponent: UIFieldClientComponent = () => {
  const { BlockCollapsible, formSchema } = useBlockComponentContext()

  return (
    <BlockCollapsible
      className={baseClass}
      editButton={false}
      Pill={
        <div className={`${baseClass}__pill`}>
          <CodeBlockIcon />
        </div>
      }
    >
      <RenderFields
        fields={formSchema}
        forceRender={true}
        parentIndexPath=""
        parentPath={''}
        parentSchemaPath=""
        permissions={true}
      />
    </BlockCollapsible>
  )
}
