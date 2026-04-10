'use client'

import { useForm } from '@payloadcms/ui'
import React from 'react'

const GetDataByPathTest: React.FC = () => {
  const { getDataByPath } = useForm()

  // Test the empty array field
  const emptyArrayResult = getDataByPath('potentiallyEmptyArray')

  // Render the result directly so e2e test can easily read it
  return (
    <div id="getDataByPath-test">
      <span id="empty-array-result">
        {Array.isArray(emptyArrayResult) ? 'ARRAY' : String(emptyArrayResult)}
      </span>
      <span id="empty-array-length">
        {Array.isArray(emptyArrayResult) ? emptyArrayResult.length : 'NOT_ARRAY'}
      </span>
    </div>
  )
}

export default GetDataByPathTest
