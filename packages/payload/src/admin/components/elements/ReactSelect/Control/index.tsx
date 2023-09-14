import type { ControlProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types'

export const Control: React.FC<ControlProps<Option, any>> = (props) => {
  const {
    children,
    innerProps,
    // @ts-expect-error // TODO Fix this - moduleResolution 16 breaks our declare module
    selectProps: { customProps: { disableKeyDown, disableMouseDown } = {} } = {},
  } = props

  return (
    <SelectComponents.Control
      {...props}
      innerProps={{
        ...innerProps,
        // @ts-ignore
        onKeyDown: (e) => {
          if (disableKeyDown) {
            e.stopPropagation()
            // Create event for keydown listeners which specifically want to bypass this stopPropagation
            const bypassEvent = new CustomEvent('bypassKeyDown', { detail: e })
            document.dispatchEvent(bypassEvent)
          }
        },
        // react-select has this typed incorrectly so we disable the linting rule
        // we need to prevent react-select from hijacking the 'onKeyDown' event while modals are open (i.e. the 'Relationship' field component)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        onMouseDown: (e) => {
          // we need to prevent react-select from hijacking the 'onMouseDown' event while modals are open (i.e. the 'Relationship' field component)
          if (!disableMouseDown) {
            innerProps.onMouseDown(e)
          }
        },
      }}
    >
      {children}
    </SelectComponents.Control>
  )
}
