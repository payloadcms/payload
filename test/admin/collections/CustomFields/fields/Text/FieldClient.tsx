'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React, { Fragment } from 'react'

import type { CustomProps } from './types.js'

export const CustomClientField: TextFieldClientComponent<CustomProps> = (props) => {
  return (
    <Fragment>
      <div id="custom-prop">{props.customProp}</div>
      <TextField {...props} />
    </Fragment>
  )
}
