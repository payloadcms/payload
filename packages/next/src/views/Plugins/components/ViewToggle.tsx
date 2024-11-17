import { LayoutGrid, List } from 'lucide-react'
import React from 'react'

import type { ViewMode } from '../types'

interface ViewToggleProps {
  onViewChange: (view: ViewMode) => void
  view: ViewMode
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ onViewChange, view }) => {
  return (
    <div className="view-toggle">
      <button
        className={`view-toggle__button ${view === 'list' ? 'view-toggle__button--active' : ''}`}
        onClick={() => onViewChange('list')}
      >
        <List className="view-toggle__icon" />
      </button>
      <button
        className={`view-toggle__button ${view === 'grid' ? 'view-toggle__button--active' : ''}`}
        onClick={() => onViewChange('grid')}
      >
        <LayoutGrid className="view-toggle__icon" />
      </button>
    </div>
  )
}
