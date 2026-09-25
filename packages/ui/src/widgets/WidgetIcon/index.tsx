import React from 'react'

import './index.css'

export const WidgetIcon = ({ name }: { name: 'images' | 'pin' | 'pin-solid' | 'table' }) => (
  <span aria-hidden="true" className={`widget-icon widget-icon--${name}`} />
)
