import { useRouteTransition } from '../index.js'
import './index.scss'

export const LoadingBar = () => {
  const { isTransitioning, transitionProgress } = useRouteTransition()

  console.log('isTransitioning', isTransitioning)
  if (isTransitioning) {
    return (
      <div className="loading-bar">
        {`${transitionProgress * 100}%`}
        <div className="loading-bar__progress" style={{ width: `${transitionProgress * 100}%` }} />
      </div>
    )
  }
}
