'use client'

import { ShimmerEffect } from '@payloadcms/ui'

import '../index.scss'

export const PendingUploadComponent = (): React.ReactNode => {
  return (
    <div className={'lexical-upload'}>
      <ShimmerEffect height={'95px'} width={'203px'} />
    </div>
  )
}
