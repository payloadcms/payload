'use client'

import React, { useState } from 'react'

export const GridCell = () => {
  const [value, setValue] = useState('Example note')
  const [activeAction, setActiveAction] = useState(0)

  return (
    <div>
      <input
        aria-label="Cell note"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value !== 'Example note') {
            event.preventDefault()
            setValue('Example note')
          }
        }}
        value={value}
      />
      <button onClick={() => setValue('')} type="button">
        Clear note
      </button>
      <div aria-label="Cell choices" role="listbox" tabIndex={0}>
        <div aria-selected="true" role="option">
          First choice
        </div>
      </div>
      <div aria-label="Cell actions" role="toolbar">
        {['First action', 'Second action'].map((label, index) => (
          <button
            key={label}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                const nextIndex = index === 0 ? 1 : 0

                setActiveAction(nextIndex)
                event.currentTarget.parentElement?.querySelectorAll('button')[nextIndex]?.focus()
              }
            }}
            tabIndex={activeAction === index ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <button disabled type="button">
        Unavailable action
      </button>
    </div>
  )
}
