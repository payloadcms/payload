'use client'
import { refreshFunction } from './refreshFunction.js'

const RefreshToken = () => {
  return <button onClick={() => refreshFunction()}>Custom Refresh</button>
}
export default RefreshToken
