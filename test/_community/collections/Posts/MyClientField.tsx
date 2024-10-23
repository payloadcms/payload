'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyClientFieldComponent: TextFieldClientComponent = ({ field, path }) => {
  return (
    <>
      <h1>HELLO</h1>
      <TextField field={field} path={path} />
    </>
  )
}
