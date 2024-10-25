'use client'

import { useField, useForm } from '@payloadcms/ui'
import * as React from 'react'

import './index.scss'

const baseClass = 'custom-blocks-field-management'

const blocksPath = 'customBlocks'

export const AddCustomBlocks: React.FC = (props) => {
  const { addFieldRow, replaceFieldRow } = useForm()
  const field = useField<number>({ path: blocksPath })
  const { value } = field
  const schemaPath = props.schemaPath.replace(`.${props.field.name}`, `.${blocksPath}`)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__blocks-grid`}>
        <button
          className={`${baseClass}__block-button`}
          onClick={async () => {
            await addFieldRow({
              data: { block1Title: 'Block 1: Prefilled Title', blockType: 'block-1' },
              path: blocksPath,
              schemaPath,
            })
          }}
          type="button"
        >
          Add Block 1
        </button>

        <button
          className={`${baseClass}__block-button`}
          onClick={async () => {
            await addFieldRow({
              data: { block2Title: 'Block 2: Prefilled Title', blockType: 'block-2' },
              path: blocksPath,
              schemaPath,
            })
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
              schemaPath,
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
