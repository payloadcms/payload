'use client'
import { refresh } from '@payloadcms/next/server-functions'

const RefreshToken = () => {
  const handleRefresh = async () => {
    const response = await refresh({ collection: 'users' })
    console.log('Token refreshed:', response)
  }

  return <button onClick={handleRefresh}>Custom Refresh</button>
}

export default RefreshToken
