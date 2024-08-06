import React from 'react'

export type PurpleBackgroundProps = {
  attributes: any
  children: React.ReactNode
}
const PurpleBackground = ({ attributes, children }: PurpleBackgroundProps) => (
  <span {...attributes} style={{ backgroundColor: 'purple' }}>
    {children}
  </span>
)

export default PurpleBackground
