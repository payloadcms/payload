import React from 'react'

const PurpleBackground: React.FC<any> = ({ attributes, children }) => (
  <span {...attributes} style={{ backgroundColor: 'purple' }}>
    {children}
  </span>
)

export default PurpleBackground
