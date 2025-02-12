'use client'
import { useRouteTransition } from '../index.js'
import './index.scss'

export const ProgressBar = () => {
  const { isTransitioning, transitionProgress } = useRouteTransition()

  if (isTransitioning) {
    return (
      <div className="progress-bar">
        <div
          className="progress-bar__progress"
          style={{ width: `${(transitionProgress || 0) * 100}%` }}
        />
      </div>
    )
  }
}
