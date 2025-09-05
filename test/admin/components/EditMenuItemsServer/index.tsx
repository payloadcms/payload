import type { EditMenuItemsServerProps } from 'payload'

import React from 'react'

export const EditMenuItemsServer = (props: EditMenuItemsServerProps) => {
  const href = `/custom-action?id=${props.id}`

  return (
    <div>
      <a href={href}>Custom Edit Menu Item (Server)</a>
    </div>
  )
}
