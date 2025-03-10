import { Button } from '@payloadcms/ui'
import React from 'react'

import { UploadControl } from './index.client.js'

export const UploadControlRSC: React.FC = () => {
  return (
    <div>
      <Button id="server-rendered-upload-button">Server Rendered Button</Button>
      <UploadControl />
    </div>
  )
}
