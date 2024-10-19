'use client'

import { useField, useForm } from '@payloadcms/ui'
import * as React from 'react'

import { blockFieldsSlug } from '../../../../slugs.js'
import './index.scss'

const baseClass = 'custom-blocks-field-management'

const blocksPath = 'customBlocks'

export const AddCustomBlocks: React.FC = () => {
  const { addFieldRow, replaceFieldRow } = useForm()
  const { value } = useField<number>({ path: blocksPath })

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__blocks-grid`}>
        <button
          className={`${baseClass}__block-button`}
          onClick={async () => {
            const renderedFieldMap = await addFieldRow({
              data: { block1Title: 'Block 1: Prefilled Title', blockType: 'block-1' },
              path: blocksPath,
              schemaAccessor: {
                schemaPath: `${blockFieldsSlug}.${blocksPath}.block-1`,
              },
            })

            // HOW DO WE THROW THIS INTO THE PROPER CONTEXT?!?!?!
          }}
          type="button"
        >
          Add Block 1
        </button>

        <button
          className={`${baseClass}__block-button`}
          onClick={() => {
            const renderedFieldMap = addFieldRow({
              data: { block2Title: 'Block 2: Prefilled Title', blockType: 'block-2' },
              path: blocksPath,
              schemaAccessor: {
                schemaPath: `${blockFieldsSlug}.${blocksPath}.block-2`,
              },
            })

            // HOW DO WE THROW THIS INTO THE PROPER CONTEXT?!?!?!
          }}
          type="button"
        >
          Add Block 2
        </button>
      </div>

      <div>
        <button
          className={`${baseClass}__block-button ${baseClass}__replace-block-button`}
          onClick={() =>
            replaceFieldRow({
              data: { block1Title: 'REPLACED BLOCK', blockType: 'block-1' },
              path: blocksPath,
              rowIndex: value - 1,
              schemaPath: `${blockFieldsSlug}.${blocksPath}.block-1`,
            })
          }
          type="button"
        >
          Replace Block {value}
        </button>
      </div>
    </div>
  )
}
