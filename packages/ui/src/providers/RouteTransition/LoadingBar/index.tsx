import { useRouteTransition } from '../index.js'
import './index.scss'

export const LoadingBar = () => {
  const { isTransitioning, transitionProgress } = useRouteTransition()

  if (isTransitioning) {
    return (
      <div className="loading-bar">
        <div className="loading-bar__progress" style={{ width: `${transitionProgress * 100}%` }} />
      </div>
    )
  }
}
