import React, { Fragment } from 'react'

import type { Page } from '../../payload-types'

import { toKebabCase } from '../../utilities/toKebabCase'
import { VerticalPadding } from '../VerticalPadding'
import { FormBlock } from './Form'

const blockComponents = {
  formBlock: FormBlock,
}

const Blocks: React.FC<{
  blocks: Page['layout']
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType, form } = block

          const isFormBlock = blockType === 'formBlock'
          // eslint-disable-next-line no-empty
          {
          }
          // @ts-expect-error: Form is not defined
          const formID: string = isFormBlock && form && (typeof form === 'string' ? form : form.id)

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            return (
              <VerticalPadding bottom="small" key={isFormBlock ? formID : index} top="small">
                {/*@ts-expect-error: Block type is dynamically determined */}
                <Block id={toKebabCase(blockName)} {...block} />
              </VerticalPadding>
            )
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}

export default Blocks
