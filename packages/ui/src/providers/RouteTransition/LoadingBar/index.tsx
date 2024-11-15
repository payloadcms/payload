import { useRouteTransition } from '../index.js'
import './index.scss'

export const LoadingBar = () => {
  const { isTransitioning } = useRouteTransition()

  return <div className="loading-bar" />
}
