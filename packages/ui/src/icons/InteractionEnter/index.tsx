import React from 'react'

import './index.css'

/**
 * Interaction Enter icon (24px, from Figma FPL icon.24.interaction.enter.small)
 * Used for the Settings menu row in the UserMenu.
 */
export const InteractionEnterIcon: React.FC<{
  readonly className?: string
  readonly size?: number
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--interaction-enter', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M7.5 6A1.5 1.5 0 0 0 6 7.5v1a.5.5 0 0 0 1 0v-1a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 0-1 0v1A1.5 1.5 0 0 0 7.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 6zm4.146 3.146a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708l1.647-1.646H9.5a.5.5 0 0 1 0-1h3.793l-1.647-1.646a.5.5 0 0 1 0-.708"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
