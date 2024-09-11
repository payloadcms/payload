import type { BlocksFieldServerComponent } from 'payload'

// import { BlocksField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomBlocksFieldServer: BlocksFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <BlocksField field={clientField} />

  return 'This is a server component for the blocks field.'
}
