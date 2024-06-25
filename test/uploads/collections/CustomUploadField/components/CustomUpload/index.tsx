import React from 'react'

import { CustomUploadClient } from './index.client.js'

export const CustomUploadRSC = () => {
  return (
    <div>
      <h2>This text was rendered on the server</h2>
      <CustomUploadClient />
    </div>
  )
}
