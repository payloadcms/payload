import * as React from 'react'

import { useForm } from '../../../../../../packages/payload/src/admin/components/forms/Form/context'
import useField from '../../../../../../packages/payload/src/admin/components/forms/useField'
import './index.scss'

const baseClass = 'custom-blocks-field-management'

export const AddCustomBlocks: React.FC = () => {
  const { addFieldRow, replaceFieldRow } = useForm()
  const { value } = useField({ path: 'customBlocks' })

  const nextIndex = typeof value === 'number' ? value + 1 : 0

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__blocks-grid`}>
        <button
          onClick={() =>
            addFieldRow({
              data: { block1Title: 'Block 1: Prefilled Title', blockType: 'block-1' },
              path: 'customBlocks',
              rowIndex: nextIndex,
            })
          }
          className={`${baseClass}__block-button`}
          type="button"
        >
          Add Block 1
        </button>

        <button
          onClick={() =>
            addFieldRow({
              data: { block2Title: 'Block 2: Prefilled Title', blockType: 'block-2' },
              path: 'customBlocks',
              rowIndex: nextIndex,
            })
          }
          className={`${baseClass}__block-button`}
          type="button"
        >
          Add Block 2
        </button>
      </div>

      <div>
        <button
          onClick={() =>
            replaceFieldRow({
              data: { block1Title: 'REPLACED BLOCK', blockType: 'block-1' },
              path: 'customBlocks',
              rowIndex: nextIndex - 1,
            })
          }
          className={`${baseClass}__block-button ${baseClass}__replace-block-button`}
          type="button"
        >
          Replace Block {nextIndex - 1}
        </button>
      </div>
    </div>
  )
}
