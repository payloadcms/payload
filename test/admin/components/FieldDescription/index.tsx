import type { DescriptionComponent, DescriptionFunction } from 'payload/types'

import React from 'react'

export const FieldDescriptionComponent: DescriptionComponent<string> = ({ path, value }) => {
  return (
    <div>
      Component description: {path} - {value}
    </div>
  )
}

export const FieldDescriptionFunction: DescriptionFunction<string> = ({ path, value }) => {
  return `Function description: ${path} - ${value}`
}
