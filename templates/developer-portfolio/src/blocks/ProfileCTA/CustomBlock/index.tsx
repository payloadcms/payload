import React from 'react'

import './index.scss'

export const ProfileUIField: React.FC = () => {
  return (
    <h3 className="profileHeroHeader">
      This block will be populated from the{' '}
      <a href="/admin/globals/profile" target="_blank">
        Profile content
      </a>
    </h3>
  )
}
