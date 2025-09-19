'use client'

import { ShimmerEffect } from '@payloadcms/ui'

import type { PendingUploadData } from '../../server/nodes/PendingUploadNode.js'

import '../component/index.scss'

export const PendingUploadComponent = (props: {
  data: PendingUploadData
  nodeKey: string
}): React.ReactNode => {
  return (
    <div className={'lexical-upload'}>
      <ShimmerEffect height={'95px'} width={'203px'} />
    </div>
  )
}
