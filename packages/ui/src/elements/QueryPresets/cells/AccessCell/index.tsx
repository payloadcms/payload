import type { DefaultCellComponentProps } from 'payload'
import type { JSX } from 'react'

import { toWords } from 'payload/shared'
import React, { Fragment } from 'react'

export const QueryPresetsAccessCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  // first sort the operations in the order they should be displayed
  const operations = ['read', 'update', 'delete']

  return (
    <p>
      {operations.reduce((acc, operation, index) => {
        const operationData = (cellData as JSON)?.[operation]

        if (operationData && operationData.constraint) {
          acc.push(
            <Fragment key={operation}>
              <span>
                <strong>{toWords(operation)}</strong>: {toWords(operationData.constraint)}
              </span>
              {index !== operations.length - 1 && ', '}
            </Fragment>,
          )
        }
        return acc
      }, [] as JSX.Element[])}
    </p>
  )
}
