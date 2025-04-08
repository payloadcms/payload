'use client'
import { refreshFunction } from './refreshFunction.js'

const RefreshToken = () => {
  const handleRefresh = async () => {
    const response = await refreshFunction({ collection: 'users' })
    console.log('Token refreshed:', response)
  }

  return <button onClick={handleRefresh}>Custom Refresh</button>
}

export default RefreshToken
