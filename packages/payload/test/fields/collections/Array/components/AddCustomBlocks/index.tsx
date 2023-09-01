import * as React from 'react'

import { useForm } from '../../../../../../src/admin/components/forms/Form/context'
import useField from '../../../../../../src/admin/components/forms/useField'
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
          className={`${baseClass}__block-button`}
          onClick={() =>
            addFieldRow({
              data: { block1Title: 'Block 1: Prefilled Title', blockType: 'block-1' },
              path: 'customBlocks',
              rowIndex: nextIndex,
            })
          }
          type="button"
        >
          Add Block 1
        </button>

        <button
          className={`${baseClass}__block-button`}
          onClick={() =>
            addFieldRow({
              data: { block2Title: 'Block 2: Prefilled Title', blockType: 'block-2' },
              path: 'customBlocks',
              rowIndex: nextIndex,
            })
          }
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
              path: 'customBlocks',
              rowIndex: nextIndex - 1,
            })
          }
          type="button"
        >
          Replace Block {nextIndex - 1}
        </button>
      </div>
    </div>
  )
}
