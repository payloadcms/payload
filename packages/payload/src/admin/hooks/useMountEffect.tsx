import { useEffect } from 'react'

const useMountEffect = (func: () => void): void => useEffect(func, [])

export default useMountEffect
