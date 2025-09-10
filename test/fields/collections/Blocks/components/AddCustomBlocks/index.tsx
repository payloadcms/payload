'use client'

import { Button, useField, useForm } from '@payloadcms/ui'
import * as React from 'react'

import './index.scss'

const baseClass = 'custom-blocks-field-management'

const blocksPath = 'customBlocks'

export const AddCustomBlocks: React.FC<any> = (props) => {
  const { addFieldRow, initializing, replaceFieldRow } = useForm()
  const field = useField<number>({ path: blocksPath })
  const { value } = field

  const schemaPath = props.schemaPath.replace(`.${props.field.name}`, `.${blocksPath}`)

  return (
    <div className={baseClass}>
      <Button
        disabled={initializing}
        onClick={() => {
          addFieldRow({
            blockType: 'block-1',
            path: blocksPath,
            schemaPath,
            subFieldState: {
              block1Title: {
                initialValue: 'Block 1: Prefilled Title',
                valid: true,
                value: 'Block 1: Prefilled Title',
              },
            },
          })
        }}
        type="button"
      >
        Add Block 1
      </Button>
      <Button
        disabled={initializing}
        onClick={() => {
          addFieldRow({
            blockType: 'block-2',
            path: blocksPath,
            schemaPath,
            subFieldState: {
              block2Title: {
                initialValue: 'Block 2: Prefilled Title',
                valid: true,
                value: 'Block 2: Prefilled Title',
              },
            },
          })
        }}
        type="button"
      >
        Add Block 2
      </Button>
      <Button
        disabled={initializing}
        onClick={() =>
          replaceFieldRow({
            blockType: 'block-1',
            path: blocksPath,
            rowIndex: value,
            schemaPath,
            subFieldState: {
              block1Title: {
                initialValue: 'REPLACED BLOCK',
                valid: true,
                value: 'REPLACED BLOCK',
              },
            },
          })
        }
        type="button"
      >
        Replace Block {value}
      </Button>
    </div>
  )
}
