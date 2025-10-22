'use client'
import { ChevronIcon, Popup, PopupList } from '@payloadcms/ui'
import React from 'react'

import { useRichTextView } from './RichTextViewProvider.js'
import './ViewSelector.scss'

export function ViewSelector(): null | React.ReactElement {
  const { currentView, setCurrentView, views } = useRichTextView()

  // Don't show if no views or only default exists
  if (!views || Object.keys(views).length === 0) {
    return null
  }

  const viewKeys = Object.keys(views)
  const hasNonDefaultViews = viewKeys.some((key) => key !== 'default')

  // If only 'default' exists, no need to show selector
  if (!hasNonDefaultViews) {
    return null
  }

  // Build list of available views
  const allViews = ['default', ...viewKeys.filter((key) => key !== 'default')]

  const currentViewLabel = currentView.charAt(0).toUpperCase() + currentView.slice(1)

  return (
    <div className="lexical-view-selector">
      <Popup
        button={
          <button className="lexical-view-selector__button" type="button">
            <span className="lexical-view-selector__label">{currentViewLabel}</span>
            <ChevronIcon className="lexical-view-selector__icon" />
          </button>
        }
        buttonType="custom"
        horizontalAlign="left"
        render={({ close }) => (
          <PopupList.ButtonGroup>
            {allViews.map((viewName) => {
              const viewLabel = viewName.charAt(0).toUpperCase() + viewName.slice(1)

              return (
                <PopupList.Button
                  active={viewName === currentView}
                  disabled={viewName === currentView}
                  key={viewName}
                  onClick={() => {
                    setCurrentView?.(viewName)
                    close()
                  }}
                >
                  {viewLabel}
                </PopupList.Button>
              )
            })}
          </PopupList.ButtonGroup>
        )}
        size="large"
      />
    </div>
  )
}
